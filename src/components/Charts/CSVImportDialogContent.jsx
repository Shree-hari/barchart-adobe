import React, { useState, useRef, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import ChartRenderer from './ChartRenderer';
import './CSVImportDialogContent.css';

const CSVImportDialogContent = ({ onClose, onDataSubmit, chartType = 'bar', theme = 'default', useFreshData = false }) => {
  // Debug: Log props

  // Get sample data structure
  const getSampleData = () => {
    return [
      ['Day', 'Sales'],
      ['Mon', '120'],
      ['Tue', '200'],
      ['Wed', '150'],
      ['Thu', '80'],
      ['Fri', '70'],
      ['Sat', '110'],
      ['Sun', '130']
    ];
  };

  // Initialize with sample data
  const initializeSampleData = () => {
    const sampleData = getSampleData();
    const sampleHeaders = sampleData[0];
    const sampleRows = sampleData.slice(1).map(row => {
      const rowObj = {};
      sampleHeaders.forEach((header, index) => {
        rowObj[header] = row[index] || '';
      });
      return rowObj;
    });
    return { headers: sampleHeaders, rows: sampleRows };
  };

  const initialData = initializeSampleData();
  
  // Load saved data from sessionStorage if available
  // If useFreshData is true (when importedData is null on page load), always use sample data
  const loadSavedData = () => {
    // If useFreshData is true, skip sessionStorage and use sample data
    if (useFreshData) {
      return {
        headers: initialData.headers,
        rows: initialData.rows,
        isSample: true
      };
    }
    
    // Otherwise, try to load from sessionStorage
    try {
      const savedDataStr = sessionStorage.getItem('csvImportDialog_savedData');
      if (savedDataStr) {
        const savedData = JSON.parse(savedDataStr);
        if (savedData && savedData.headers && savedData.rows && Array.isArray(savedData.rows)) {
          return {
            headers: savedData.headers,
            rows: savedData.rows,
            isSample: false
          };
        }
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
    // Default to sample data
    return {
      headers: initialData.headers,
      rows: initialData.rows,
      isSample: true
    };
  };

  const savedData = loadSavedData();
  const [tableData, setTableData] = useState(savedData.rows);
  const [headers, setHeaders] = useState(savedData.headers);
  const [isUsingSampleData, setIsUsingSampleData] = useState(savedData.isSample);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [draggedRowIndex, setDraggedRowIndex] = useState(null);
  const fileInputRef = useRef(null);
  const tableWrapperRef = useRef(null);
  const rowRefs = useRef({});

  // Load sample data (reset to sample)
  const handleTrySampleData = useCallback(() => {
    const initial = initializeSampleData();
    setHeaders(initial.headers);
    setTableData(initial.rows);
    setIsUsingSampleData(true);
    // Clear saved data when resetting to sample
    try {
      sessionStorage.removeItem('csvImportDialog_savedData');
    } catch (error) {
      console.error('Error clearing saved data:', error);
    }
  }, []);

  // Download sample CSV
  const handleDownloadSample = useCallback((e) => {
    e.preventDefault();
    try {
      const sampleData = getSampleData();
      const csvContent = sampleData.map(row => 
        row.map(cell => {
          const escaped = String(cell).replace(/"/g, '""');
          if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
            return `"${escaped}"`;
          }
          return escaped;
        }).join(',')
      ).join('\n');

      const BOM = '\uFEFF';
      const csvWithBOM = BOM + csvContent;

      const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'sample-chart-data.csv';
      link.style.display = 'none';
      document.body.appendChild(link);
      
      requestAnimationFrame(() => {
        link.click();
        setTimeout(() => {
          if (link.parentNode) {
            document.body.removeChild(link);
          }
          URL.revokeObjectURL(blobUrl);
        }, 100);
      });
    } catch (error) {
      console.error('Error creating CSV download:', error);
      alert('Failed to download sample file.');
    }
  }, []);

  // Parse CSV file
  const parseCSV = async (file) => {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('File must contain at least a header row and one data row.');
    }

    const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const validHeaderIndices = [];
    const validHeaders = [];
    
    rawHeaders.forEach((header, index) => {
      if (header && header.trim() !== '') {
        validHeaderIndices.push(index);
        validHeaders.push(header);
      }
    });
    
    if (validHeaders.length === 0) {
      throw new Error('File must contain valid column headers.');
    }
    
    const headerCounts = {};
    const duplicateHeaders = [];
    
    validHeaders.forEach((header) => {
      if (headerCounts[header]) {
        headerCounts[header]++;
        if (headerCounts[header] === 2) {
          duplicateHeaders.push(header);
        }
      } else {
        headerCounts[header] = 1;
      }
    });
    
    if (duplicateHeaders.length > 0) {
      throw new Error('File contains duplicate column headers.');
    }

    const data = lines.slice(1).map((line) => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row = {};
      validHeaders.forEach((header, index) => {
        const originalIndex = validHeaderIndices[index];
        row[header] = values[originalIndex] || '';
      });
      return row;
    }).filter(row => {
      return Object.values(row).some(val => val && val.trim() !== '');
    });

    if (data.length === 0) {
      throw new Error('File must contain at least one data row.');
    }

    return { headers: validHeaders, data };
  };

  // Parse Excel file
  const parseExcel = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    
    if (jsonData.length < 2) {
      throw new Error('File must contain at least a header row and one data row.');
    }

    const rawHeaders = jsonData[0].map(h => String(h || '').trim());
    
    const validHeaderIndices = [];
    const validHeaders = [];
    
    rawHeaders.forEach((header, index) => {
      if (header && header.trim() !== '') {
        validHeaderIndices.push(index);
        validHeaders.push(header);
      }
    });
    
    if (validHeaders.length === 0) {
      throw new Error('File must contain valid column headers.');
    }
    
    const headerCounts = {};
    const duplicateHeaders = [];
    
    validHeaders.forEach((header) => {
      if (headerCounts[header]) {
        headerCounts[header]++;
        if (headerCounts[header] === 2) {
          duplicateHeaders.push(header);
        }
      } else {
        headerCounts[header] = 1;
      }
    });
    
    if (duplicateHeaders.length > 0) {
      throw new Error('File contains duplicate column headers.');
    }

    const data = jsonData.slice(1).map((row) => {
      const rowObj = {};
      validHeaders.forEach((header, index) => {
        const originalIndex = validHeaderIndices[index];
        rowObj[header] = String(row[originalIndex] || '').trim();
      });
      return rowObj;
    }).filter(row => {
      return Object.values(row).some(val => val && val.trim() !== '');
    });

    if (data.length === 0) {
      throw new Error('File must contain at least one data row.');
    }

    return { headers: validHeaders, data };
  };

  const handleFile = async (file) => {
    if (!file) return;

    const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB
    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert('File size exceeds the maximum limit of 1 MB. Please upload a smaller, compliant CSV or Excel file (less than 1 MB).');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const fileName = file.name.toLowerCase();
    const isCSV = fileName.endsWith('.csv');
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    
    if (!isCSV && !isExcel) {
      alert('Please select a CSV or Excel file (.csv, .xlsx, .xls).');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setIsLoading(true);
    
    try {
      let parsedData;
      
      if (isCSV) {
        parsedData = await parseCSV(file);
      } else {
        parsedData = await parseExcel(file);
      }

      if (parsedData.headers.length < 2) {
        throw new Error('File must contain at least 2 columns: one for labels and one for values.');
      }

      setHeaders(parsedData.headers);
      setTableData(parsedData.data);
      setIsUsingSampleData(false);
      // Save imported data to sessionStorage
      try {
        sessionStorage.setItem('csvImportDialog_savedData', JSON.stringify({
          headers: parsedData.headers,
          rows: parsedData.data
        }));
      } catch (error) {
        console.error('Error saving imported data:', error);
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      alert(error.message || 'The file you selected is invalid.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // Handle cell edit
  const handleCellEdit = useCallback((rowIndex, header, value) => {
    setTableData(prevData => {
      const newData = [...prevData];
      newData[rowIndex] = {
        ...newData[rowIndex],
        [header]: value
      };
      // Save updated data to sessionStorage
      try {
        sessionStorage.setItem('csvImportDialog_savedData', JSON.stringify({
          headers: headers,
          rows: newData
        }));
      } catch (error) {
        console.error('Error saving edited data:', error);
      }
      return newData;
    });
  }, [headers]);

  // Add new row
  const handleAddRow = useCallback(() => {
    if (!headers.length) return;
    const newRow = {};
    headers.forEach(header => {
      newRow[header] = '';
    });
    setTableData(prevData => {
      const updatedData = [...(prevData || []), newRow];
      const newRowIndex = updatedData.length - 1;
      
      // Save updated data to sessionStorage
      try {
        sessionStorage.setItem('csvImportDialog_savedData', JSON.stringify({
          headers: headers,
          rows: updatedData
        }));
      } catch (error) {
        console.error('Error saving data after adding row:', error);
      }
      
      // Auto-scroll to newly added row
      setTimeout(() => {
        const rowElement = rowRefs.current[`row-${newRowIndex}`];
        if (rowElement && tableWrapperRef.current) {
          rowElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
      
      return updatedData;
    });
  }, [headers]);

  // Delete row
  const handleDeleteRow = useCallback((rowIndex) => {
    setTableData(prevData => {
      const newData = [...prevData];
      newData.splice(rowIndex, 1);
      // Save updated data to sessionStorage
      try {
        sessionStorage.setItem('csvImportDialog_savedData', JSON.stringify({
          headers: headers,
          rows: newData
        }));
      } catch (error) {
        console.error('Error saving data after deleting row:', error);
      }
      return newData;
    });
  }, [headers]);

  // Handle row drag start
  const handleRowDragStart = useCallback((e, rowIndex) => {
    setDraggedRowIndex(rowIndex);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', rowIndex);
  }, []);

  // Handle row drag over
  const handleRowDragOver = useCallback((e, targetIndex) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle row drop
  const handleRowDrop = useCallback((e, targetIndex) => {
    e.preventDefault();
    
    if (draggedRowIndex === null || draggedRowIndex === targetIndex) {
      setDraggedRowIndex(null);
      return;
    }
    
    setTableData(prevData => {
      const newData = [...prevData];
      const draggedRow = newData[draggedRowIndex];
      newData.splice(draggedRowIndex, 1);
      newData.splice(targetIndex, 0, draggedRow);
      
      // Save updated data to sessionStorage
      try {
        sessionStorage.setItem('csvImportDialog_savedData', JSON.stringify({
          headers: headers,
          rows: newData
        }));
      } catch (error) {
        console.error('Error saving data after reordering row:', error);
      }
      
      return newData;
    });
    
    setDraggedRowIndex(null);
  }, [draggedRowIndex, headers]);

  // Handle row drag end
  const handleRowDragEnd = useCallback(() => {
    setDraggedRowIndex(null);
  }, []);

  // Submit data
  const handleSubmit = useCallback(() => {
    if (!tableData || !headers.length || tableData.length === 0) {
      alert('Please add some data before submitting.');
      return;
    }

    if (headers.length < 2) {
      alert('Data must contain at least 2 columns: one for labels and one for values.');
      return;
    }

    const labelColumn = headers[0];
    // Get all value columns (columns 2+)
    const valueColumns = headers.slice(1);
    
    // Extract labels
    const labels = tableData.map(row => row[labelColumn] || '');
    
    // Extract values for each value column
    const values = valueColumns.map(column => 
      tableData.map(row => parseFloat(row[column]) || 0)
    );

    // Validate that we have at least some numeric values
    const hasValidNumbers = values.some(columnValues => 
      columnValues.some(val => !isNaN(val) && isFinite(val))
    );
    if (!hasValidNumbers) {
      alert('The values columns must contain numeric data.');
      return;
    }

    // For backward compatibility, if only one value column, use single array
    // Otherwise, use array of arrays for multiple series
    const chartData = valueColumns.length === 1 
      ? { labels, values: values[0] }
      : { labels, values, seriesNames: valueColumns };

    
    // Save current table data before submitting
    try {
      sessionStorage.setItem('csvImportDialog_savedData', JSON.stringify({
        headers: headers,
        rows: tableData
      }));
    } catch (error) {
      console.error('Error saving data before submit:', error);
    }
    
    onDataSubmit(chartData);
  }, [tableData, headers, onDataSubmit]);

  // Prepare chart data from table
  const chartData = useMemo(() => {
    if (!tableData || !headers.length || tableData.length === 0) {
      return null;
    }

    const labelColumn = headers[0];
    const valueColumns = headers.slice(1);
    
    const labels = tableData.map(row => row[labelColumn] || '');
    const values = valueColumns.map(column => 
      tableData.map(row => parseFloat(row[column]) || 0)
    );

    return valueColumns.length === 1 
      ? { labels, values: values[0] }
      : { labels, values, seriesNames: valueColumns };
  }, [tableData, headers]);

  return (
    <div className="csv-import-dialog-content">
      <div className="csv-import-dialog-body">
        {/* Top Actions - Right Aligned */}
        <div className="csv-import-top-actions">
          <button 
            className="csv-import-try-sample-btn"
            onClick={handleTrySampleData}
          >
            Try with Sample Data
          </button>
          <a 
            href="#" 
            className="csv-import-download-link"
            onClick={handleDownloadSample}
          >
            Download CSV Sample
          </a>
        </div>

        {/* Full Width Drag and Drop Zone */}
        <div 
          className={`csv-import-drop-zone ${isDragOver ? 'drag-over' : ''}`}
          onClick={handleImportClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{ cursor: 'pointer' }}
        >
          <p className="drop-text">Click to import CSV or Excel file</p>
          <p className="drop-or">or</p>
          <p className="drop-text">Drag and drop your file here</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {isLoading && (
          <div className="csv-import-loading">Processing...</div>
        )}

        {/* Edit Data Section */}
        {tableData && headers.length > 0 ? (
          <div className="csv-import-table-container">
            <div className="csv-import-table-header">
              <div>
                <h3>Edit Data</h3>
                <p className="csv-import-data-info">
                  {isUsingSampleData ? (
                    <span className="csv-import-dummy-badge">📊 Showing sample data - Drag & drop your CSV to replace</span>
                  ) : (
                    <span className="csv-import-csv-badge">📄 Your CSV data - Edit cells below</span>
                  )}
                </p>
              </div>
              <button 
                className="csv-import-add-row-btn"
                onClick={handleAddRow}
              >
                + Add Row
              </button>
            </div>
            <div 
              ref={tableWrapperRef}
              className="csv-import-table-wrapper"
            >
              <table className="csv-import-table">
                <thead>
                  <tr>
                    <th style={{ width: '30px' }}></th>
                    {headers.map((header, idx) => (
                      <th key={idx}>{header}</th>
                    ))}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, rowIndex) => (
                    <tr 
                      key={rowIndex}
                      ref={el => rowRefs.current[`row-${rowIndex}`] = el}
                      draggable
                      onDragStart={(e) => handleRowDragStart(e, rowIndex)}
                      onDragOver={(e) => handleRowDragOver(e, rowIndex)}
                      onDrop={(e) => handleRowDrop(e, rowIndex)}
                      onDragEnd={handleRowDragEnd}
                      className={draggedRowIndex === rowIndex ? 'csv-import-row-dragging' : ''}
                    >
                      <td className="csv-import-drag-handle">
                        <span className="csv-import-drag-icon">⋮⋮</span>
                      </td>
                      {headers.map((header, colIndex) => (
                        <td key={colIndex}>
                          <input
                            type="text"
                            value={row[header] || ''}
                            onChange={(e) => handleCellEdit(rowIndex, header, e.target.value)}
                            className="csv-import-cell-input"
                          />
                        </td>
                      ))}
                      <td>
                        <button
                          className="csv-import-delete-row-btn"
                          onClick={() => handleDeleteRow(rowIndex)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="csv-import-empty-state">
            <p className="csv-import-empty-text">
              📊 <strong>Sample data loaded</strong>
            </p>
            <p className="csv-import-empty-subtext">
              Drag and drop your CSV file above to replace the sample data, or click "Try with Sample Data" to reset.
            </p>
          </div>
        )}

        {/* Footer with Apply Data - Right Aligned */}
        <div className="csv-import-dialog-footer">
          <button 
            className="csv-import-cancel-btn"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="csv-import-submit-btn"
            onClick={handleSubmit}
            disabled={!tableData || tableData.length === 0}
          >
            Apply Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default CSVImportDialogContent;

