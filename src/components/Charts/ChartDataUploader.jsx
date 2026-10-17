import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import './ChartDataUploader.css';

const ChartDataUploader = ({ onDataUploaded, onClose }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [warningMessage, setWarningMessage] = useState(null);
  const fileInputRef = useRef(null);

  // Get sample data structure for charts
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

  // Parse CSV file
  const parseCSV = async (file) => {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('File must contain at least a header row and one data row.');
    }

    // Parse CSV (simple parsing - handles basic CSV format)
    const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    // Filter out empty or blank headers and track their indices
    const validHeaderIndices = [];
    const validHeaders = [];
    
    rawHeaders.forEach((header, index) => {
      if (header && header.trim() !== '') {
        validHeaderIndices.push(index);
        validHeaders.push(header);
      }
    });
    
    // Check if there are any valid headers
    if (validHeaders.length === 0) {
      throw new Error('File must contain valid column headers.');
    }
    
    // Check for duplicate headers
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

    // Parse data rows
    const data = lines.slice(1).map((line, rowIndex) => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row = {};
      validHeaders.forEach((header, index) => {
        const originalIndex = validHeaderIndices[index];
        row[header] = values[originalIndex] || '';
      });
      return row;
    }).filter(row => {
      // Filter out completely empty rows
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
    
    // Get first sheet
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    
    if (jsonData.length < 2) {
      throw new Error('File must contain at least a header row and one data row.');
    }

    // Get headers from first row
    const rawHeaders = jsonData[0].map(h => String(h || '').trim());
    
    // Filter out empty headers
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
    
    // Check for duplicate headers
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

    // Parse data rows
    const data = jsonData.slice(1).map((row) => {
      const rowObj = {};
      validHeaders.forEach((header, index) => {
        const originalIndex = validHeaderIndices[index];
        rowObj[header] = String(row[originalIndex] || '').trim();
      });
      return rowObj;
    }).filter(row => {
      // Filter out completely empty rows
      return Object.values(row).some(val => val && val.trim() !== '');
    });

    if (data.length === 0) {
      throw new Error('File must contain at least one data row.');
    }

    return { headers: validHeaders, data };
  };

  // Validate chart data format
  const validateChartData = (headers, data) => {
    if (headers.length < 2) {
      throw new Error('File must contain at least 2 columns: one for labels and one for values.');
    }

    // Check if second column contains numeric values
    const valueColumn = headers[1];
    const hasValidNumbers = data.some(row => {
      const value = row[valueColumn];
      return value && !isNaN(parseFloat(value)) && isFinite(value);
    });

    if (!hasValidNumbers) {
      throw new Error('The values column must contain numeric data.');
    }

    return true;
  };

  const handleFile = async (file) => {
    if (!file) {
      setWarningMessage('Please select a file.');
      return;
    }

    const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setWarningMessage('File size exceeds the maximum limit of 1 MB. Please upload a smaller, compliant CSV or Excel file (less than 1 MB).');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const fileName = file.name.toLowerCase();
    const isCSV = fileName.endsWith('.csv');
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    
    if (!isCSV && !isExcel) {
      setWarningMessage('Please select a CSV or Excel file (.csv, .xlsx, .xls).');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setIsLoading(true);
    setWarningMessage(null);
    
    try {
      let parsedData;
      
      if (isCSV) {
        parsedData = await parseCSV(file);
      } else {
        parsedData = await parseExcel(file);
      }

      // Validate chart data format
      validateChartData(parsedData.headers, parsedData.data);

      // Convert to chart format: { labels: [], values: [] } or { labels: [], values: [[], []...], seriesNames: [] }
      const labelColumn = parsedData.headers[0];
      const valueColumns = parsedData.headers.slice(1);
      
      const labels = parsedData.data.map(row => row[labelColumn] || '');
      const values = valueColumns.map(column => 
        parsedData.data.map(row => parseFloat(row[column]) || 0)
      );
      
      const chartData = valueColumns.length === 1 
        ? { labels, values: values[0] }
        : { labels, values, seriesNames: valueColumns };

      onDataUploaded(chartData);
      setWarningMessage(null);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Close modal after successful upload
      setTimeout(() => {
        if (onClose) onClose();
      }, 500);
      
    } catch (error) {
      console.error('Error parsing file:', error);
      setWarningMessage(error.message || 'The file you selected is invalid.');
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
      setWarningMessage(null);
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
      setWarningMessage(null);
      handleFile(file);
    }
  };

  const handleImportClick = () => {
    setWarningMessage(null);
    fileInputRef.current?.click();
  };

  // Load sample data directly
  const handleTrySampleData = () => {
    try {
      const sampleData = getSampleData();
      const headers = sampleData[0];
      const data = sampleData.slice(1).map(row => {
        const rowObj = {};
        headers.forEach((header, index) => {
          rowObj[header] = row[index] || '';
        });
        return rowObj;
      });

      const chartData = {
        labels: data.map(row => row[headers[0]] || ''),
        values: data.map(row => parseFloat(row[headers[1]]) || 0)
      };

      setWarningMessage(null);
      onDataUploaded(chartData);
      
      setTimeout(() => {
        if (onClose) onClose();
      }, 500);
    } catch (error) {
      console.error('Error loading sample data:', error);
      setWarningMessage('Failed to load sample data.');
    }
  };

  // Render sample data preview table
  const renderSamplePreview = () => {
    const sampleData = getSampleData();
    const headers = sampleData[0];
    const rows = sampleData.slice(1).slice(0, 5); // Show first 5 rows

    return (
      <div className="sample-preview-container">
        <div className="sample-preview-actions">
          <button
            className="try-sample-button"
            onClick={handleTrySampleData}
          >
            Try with this sample data
          </button>
          <span 
            className="download-sample-link" 
            onClick={(e) => {
              e.preventDefault();
              downloadSampleCsv(e);
            }}
          >
            Download Sample CSV
          </span>
        </div>
        <p className="sample-preview-title">Our sample data preview:</p>
        <div className="sample-preview-table-wrapper">
          <table className="sample-preview-table">
            <thead>
              <tr>
                {headers.map((header, idx) => (
                  <th key={idx}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {sampleData.length > 6 && (
            <p className="sample-preview-more">... and {sampleData.length - 6} more rows</p>
          )}
        </div>
      </div>
    );
  };

  // Download sample CSV
  const downloadSampleCsv = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

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
      setWarningMessage('Failed to download sample file.');
    }
  };

  return (
    <div className="chart-data-uploader">
      <div className="import-section">
        <button 
          className="import-table-button"
          onClick={handleImportClick}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Import Table'}
        </button>
        
        <div 
          className={`drop-zone ${isDragOver ? 'drag-over' : ''}`}
          onClick={handleImportClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{ cursor: 'pointer' }}
        >
          <p className="drop-text">Click to import local CSV or Excel file</p>
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
      </div>
      
      {warningMessage && (
        <div className="warning-message">
          <p>⚠️ {warningMessage}</p>
          {renderSamplePreview()}
        </div>
      )}
    </div>
  );
};

export default ChartDataUploader;





