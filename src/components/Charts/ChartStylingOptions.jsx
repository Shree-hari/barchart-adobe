import React, { useState, useRef, useEffect } from 'react';
import "@spectrum-web-components/picker/sp-picker.js";
import "@spectrum-web-components/menu/sp-menu.js";
import "@spectrum-web-components/menu/sp-menu-item.js";
import '@spectrum-web-components/icons-workflow/icons/sp-icon-refresh.js';
import './ChartStylingOptions.css';

const ChartStylingOptions = React.memo(({ chartType, stylingOptions, onStylingChange }) => {
    const [localOptions, setLocalOptions] = useState({
        // Common options
        labelVisible: stylingOptions?.labelVisible ?? true,
        valueVisible: stylingOptions?.valueVisible ?? true,
        fontFamily: stylingOptions?.fontFamily ?? 'Arial',
        fontStyle: stylingOptions?.fontStyle ?? 'normal',
        fontWeight: stylingOptions?.fontWeight ?? 400,
        fontSize: stylingOptions?.fontSize ?? 12,
        // Axis options (for axis-based charts)
        xAxisRotation: stylingOptions?.xAxisRotation ?? 0,
        yAxisRotation: stylingOptions?.yAxisRotation ?? 0,
        // Line/Area options
        lineWidth: stylingOptions?.lineWidth ?? 3,
        lineSmooth: stylingOptions?.lineSmooth ?? true,
        showDataPoints: stylingOptions?.showDataPoints ?? (chartType === 'line' || chartType === 'area' || chartType === 'radar' ? true : false),
        pointSize: stylingOptions?.pointSize ?? 8,
        // Bar options
        barWidth: stylingOptions?.barWidth ?? 60,
        barBorderRadius: stylingOptions?.barBorderRadius ?? 4,
        barSpacing: stylingOptions?.barSpacing ?? 0,
        // Pie options
        innerRadius: stylingOptions?.innerRadius ?? (chartType === 'pie-nightingale' ? 0 : 20),
        outerRadius: stylingOptions?.outerRadius ?? (chartType === 'pie-nightingale' ? 100 : 40),
        labelLineLength: stylingOptions?.labelLineLength ?? 15,
        showLegend: stylingOptions?.showLegend ?? true,
        // Radar options
        radarRadius: stylingOptions?.radarRadius ?? 70,
        radarNameGap: stylingOptions?.radarNameGap ?? 5,
        radarSplitNumber: stylingOptions?.radarSplitNumber ?? 5,
        radarShape: stylingOptions?.radarShape ?? 'polygon',
        radarShowArea: stylingOptions?.radarShowArea ?? true,
        radarAreaOpacity: stylingOptions?.radarAreaOpacity ?? 30,
        // Funnel options
        funnelWidth: stylingOptions?.funnelWidth ?? 80,
        funnelGap: stylingOptions?.funnelGap ?? 2,
        funnelLabelPosition: stylingOptions?.funnelLabelPosition ?? 'inside',
        funnelSort: stylingOptions?.funnelSort ?? 'descending',
        // Scatter options
        scatterPointSize: stylingOptions?.scatterPointSize ?? 20,
        scatterPointShape: stylingOptions?.scatterPointShape ?? 'circle',
        scatterShowLabels: stylingOptions?.scatterShowLabels ?? true,
        scatterSort: stylingOptions?.scatterSort ?? 'none',
        scatterLabelPosition: stylingOptions?.scatterLabelPosition ?? 'top',
        // Area options
        areaOpacity: stylingOptions?.areaOpacity ?? 50
    });

    const fontFamilyPickerRef = useRef(null);
    const fontStylePickerRef = useRef(null);
    const xAxisRotationPickerRef = useRef(null);
    const yAxisRotationPickerRef = useRef(null);
    const funnelLabelPositionPickerRef = useRef(null);
    const funnelSortPickerRef = useRef(null);
    const scatterPointShapePickerRef = useRef(null);
    const scatterSortPickerRef = useRef(null);
    const scatterLabelPositionPickerRef = useRef(null);
    const radarShapePickerRef = useRef(null);

    // Adobe-supported free fonts
    const fontFamilies = [
        { label: 'Arial', value: 'Arial' },
        { label: 'Helvetica', value: 'Helvetica' },
        { label: 'Times New Roman', value: 'Times New Roman' },
        { label: 'Courier New', value: 'Courier New' },
        { label: 'Verdana', value: 'Verdana' },
        { label: 'Georgia', value: 'Georgia' },
        { label: 'Palatino', value: 'Palatino' },
        { label: 'Garamond', value: 'Garamond' },
        { label: 'Bookman', value: 'Bookman' },
        { label: 'Comic Sans MS', value: 'Comic Sans MS' },
        { label: 'Trebuchet MS', value: 'Trebuchet MS' },
        { label: 'Arial Black', value: 'Arial Black' },
        { label: 'Impact', value: 'Impact' },
        { label: 'Lucida Console', value: 'Lucida Console' },
        { label: 'Tahoma', value: 'Tahoma' }
    ];

    const fontStyles = [
        { label: 'Normal', value: 'normal' },
        { label: 'Bold', value: 'bold' },
        { label: 'Italic', value: 'italic' }
    ];

    const rotationOptions = [
        { label: '0°', value: 0 },
        { label: '15°', value: 15 },
        { label: '30°', value: 30 },
        { label: '45°', value: 45 },
        { label: '90°', value: 90 }
    ];

    const pointShapes = [
        { label: 'Circle', value: 'circle' },
        { label: 'Rectangle', value: 'rect' },
        { label: 'Round Rectangle', value: 'roundRect' },
        { label: 'Triangle', value: 'triangle' },
        { label: 'Diamond', value: 'diamond' },
        { label: 'Pin', value: 'pin' },
        { label: 'Arrow', value: 'arrow' }
    ];

    const funnelLabelPositions = [
        { label: 'Inside', value: 'inside' },
        { label: 'Outside', value: 'outside' }
    ];

    const funnelSortOptions = [
        { label: 'Descending', value: 'descending' },
        { label: 'Ascending', value: 'ascending' }
    ];

    // Check if chart type has axis
    const hasAxis = ['bar', 'line', 'area', 'scatter', 'bar-horizontal', 'mixed'].includes(chartType);
    const isLineChart = ['line', 'area', 'mixed'].includes(chartType);
    const isBarChart = ['bar', 'bar-horizontal', 'mixed'].includes(chartType);
    const isPieChart = ['pie', 'pie-nightingale'].includes(chartType);
    const isRadarChart = chartType === 'radar';
    const isFunnelChart = chartType === 'funnel';
    const isScatterChart = chartType === 'scatter';
    const isAreaChart = chartType === 'area';

    // Update local state when prop changes
    useEffect(() => {
        if (stylingOptions) {
            setLocalOptions(prev => ({
                ...prev,
                labelVisible: stylingOptions.labelVisible ?? true,
                valueVisible: stylingOptions.valueVisible ?? true,
                fontFamily: stylingOptions.fontFamily ?? 'Arial',
                fontStyle: stylingOptions.fontStyle ?? 'normal',
                fontWeight: stylingOptions.fontWeight ?? 400,
                fontSize: stylingOptions.fontSize ?? 12,
                xAxisRotation: stylingOptions.xAxisRotation ?? 0,
                yAxisRotation: stylingOptions.yAxisRotation ?? 0,
                lineWidth: stylingOptions.lineWidth ?? 3,
                lineSmooth: stylingOptions.lineSmooth ?? true,
                showDataPoints: stylingOptions.showDataPoints !== undefined ? stylingOptions.showDataPoints : (chartType === 'line' || chartType === 'area' || chartType === 'radar' ? true : false),
                pointSize: stylingOptions.pointSize ?? 8,
                barWidth: stylingOptions.barWidth ?? 60,
                barBorderRadius: stylingOptions.barBorderRadius ?? 4,
                barSpacing: stylingOptions.barSpacing ?? 0,
                innerRadius: stylingOptions.innerRadius ?? prev.innerRadius,
                outerRadius: stylingOptions.outerRadius ?? prev.outerRadius,
                labelLineLength: stylingOptions.labelLineLength ?? 15,
                showLegend: stylingOptions.showLegend ?? true,
                funnelWidth: stylingOptions.funnelWidth ?? 80,
                funnelGap: stylingOptions.funnelGap ?? 2,
                funnelLabelPosition: stylingOptions.funnelLabelPosition ?? 'inside',
                funnelSort: stylingOptions.funnelSort ?? 'descending',
                scatterPointSize: stylingOptions.scatterPointSize ?? 20,
                scatterPointShape: stylingOptions.scatterPointShape ?? 'circle',
                scatterShowLabels: stylingOptions.scatterShowLabels ?? true,
                scatterSort: stylingOptions.scatterSort ?? 'none',
                scatterLabelPosition: stylingOptions.scatterLabelPosition ?? 'top',
                areaOpacity: stylingOptions.areaOpacity ?? 50,
                radarRadius: stylingOptions.radarRadius ?? prev.radarRadius,
                radarNameGap: stylingOptions.radarNameGap ?? prev.radarNameGap,
                radarSplitNumber: stylingOptions.radarSplitNumber ?? prev.radarSplitNumber,
                radarShape: stylingOptions.radarShape ?? prev.radarShape,
                radarShowArea: stylingOptions.radarShowArea ?? prev.radarShowArea,
                radarAreaOpacity: stylingOptions.radarAreaOpacity ?? prev.radarAreaOpacity
            }));
        }
    }, [stylingOptions]);

    // Sync picker values and set up event listeners for font family and font style
    useEffect(() => {
        const fontFamilyPicker = fontFamilyPickerRef.current;
        if (fontFamilyPicker) {
            // Update value if it changed
            if (fontFamilyPicker.value !== localOptions.fontFamily) {
                fontFamilyPicker.value = localOptions.fontFamily;
            }
            
            // Set up change event listener
            const handleFontFamilyChangeEvent = (event) => {
                const newFontFamily = event.target.value;
                
                // Use functional update to get latest localOptions
                setLocalOptions(prev => {
                    const newOptions = {
                        ...prev,
                        fontFamily: newFontFamily
                    };
                    
                    if (onStylingChange) {
                        
                        onStylingChange(newOptions);
                    }
                    return newOptions;
                });
            };
            
            fontFamilyPicker.addEventListener('change', handleFontFamilyChangeEvent);
            return () => {
                fontFamilyPicker.removeEventListener('change', handleFontFamilyChangeEvent);
            };
        }
    }, [localOptions.fontFamily, onStylingChange]);

    useEffect(() => {
        const fontStylePicker = fontStylePickerRef.current;
        if (fontStylePicker) {
            // Update value if it changed
            if (fontStylePicker.value !== localOptions.fontStyle) {
                fontStylePicker.value = localOptions.fontStyle;
            }
            
            // Set up change event listener
            const handleFontStyleChangeEvent = (event) => {
                const newFontStyle = event.target.value;
                
                // Use functional update to get latest localOptions
                setLocalOptions(prev => {
                    const newOptions = {
                        ...prev,
                        fontStyle: newFontStyle
                    };
                    
                    if (onStylingChange) {
                        
                        onStylingChange(newOptions);
                    }
                    return newOptions;
                });
            };
            
            fontStylePicker.addEventListener('change', handleFontStyleChangeEvent);
            return () => {
                fontStylePicker.removeEventListener('change', handleFontStyleChangeEvent);
            };
        }
    }, [localOptions.fontStyle, onStylingChange]);

    // Set up event listener for X-Axis Rotation picker
    useEffect(() => {
        const xAxisRotationPicker = xAxisRotationPickerRef.current;
        if (xAxisRotationPicker) {
            // Update value if it changed
            if (xAxisRotationPicker.value !== localOptions.xAxisRotation.toString()) {
                xAxisRotationPicker.value = localOptions.xAxisRotation.toString();
            }
            
            // Set up change event listener
            const handleXAxisRotationChangeEvent = (event) => {
                const newRotation = parseInt(event.target.value, 10);
                
                // Use functional update to get latest localOptions
                setLocalOptions(prev => {
                    const newOptions = {
                        ...prev,
                        xAxisRotation: newRotation
                    };
                    
                    if (onStylingChange) {
                        onStylingChange(newOptions);
                    }
                    return newOptions;
                });
            };
            
            xAxisRotationPicker.addEventListener('change', handleXAxisRotationChangeEvent);
            return () => {
                xAxisRotationPicker.removeEventListener('change', handleXAxisRotationChangeEvent);
            };
        }
    }, [localOptions.xAxisRotation, onStylingChange]);

    // Set up event listener for Y-Axis Rotation picker
    useEffect(() => {
        const yAxisRotationPicker = yAxisRotationPickerRef.current;
        if (yAxisRotationPicker) {
            // Update value if it changed
            if (yAxisRotationPicker.value !== localOptions.yAxisRotation.toString()) {
                yAxisRotationPicker.value = localOptions.yAxisRotation.toString();
            }
            
            // Set up change event listener
            const handleYAxisRotationChangeEvent = (event) => {
                const newRotation = parseInt(event.target.value, 10);
                
                // Use functional update to get latest localOptions
                setLocalOptions(prev => {
                    const newOptions = {
                        ...prev,
                        yAxisRotation: newRotation
                    };
                    
                    if (onStylingChange) {
                        onStylingChange(newOptions);
                    }
                    return newOptions;
                });
            };
            
            yAxisRotationPicker.addEventListener('change', handleYAxisRotationChangeEvent);
            return () => {
                yAxisRotationPicker.removeEventListener('change', handleYAxisRotationChangeEvent);
            };
        }
    }, [localOptions.yAxisRotation, onStylingChange]);

    // Set up event listener for Funnel Label Position picker
    useEffect(() => {
        const funnelLabelPositionPicker = funnelLabelPositionPickerRef.current;
        if (funnelLabelPositionPicker) {
            // Update value if it changed
            if (funnelLabelPositionPicker.value !== localOptions.funnelLabelPosition) {
                funnelLabelPositionPicker.value = localOptions.funnelLabelPosition;
            }
            
            // Set up change event listener
            const handleFunnelLabelPositionChangeEvent = (event) => {
                const newValue = event.target.value;
                
                setLocalOptions(prev => {
                    const newOptions = {
                        ...prev,
                        funnelLabelPosition: newValue
                    };
                    if (onStylingChange) {
                        onStylingChange(newOptions);
                    }
                    return newOptions;
                });
            };
            
            funnelLabelPositionPicker.addEventListener('change', handleFunnelLabelPositionChangeEvent);
            return () => {
                funnelLabelPositionPicker.removeEventListener('change', handleFunnelLabelPositionChangeEvent);
            };
        }
    }, [onStylingChange]);

    // Sync funnel label position picker value
    useEffect(() => {
        if (funnelLabelPositionPickerRef.current && funnelLabelPositionPickerRef.current.value !== localOptions.funnelLabelPosition) {
            funnelLabelPositionPickerRef.current.value = localOptions.funnelLabelPosition;
        }
    }, [localOptions.funnelLabelPosition]);

    // Set up event listener for Funnel Sort picker
    useEffect(() => {
        const funnelSortPicker = funnelSortPickerRef.current;
        if (funnelSortPicker) {
            // Update value if it changed
            if (funnelSortPicker.value !== localOptions.funnelSort) {
                funnelSortPicker.value = localOptions.funnelSort;
            }
            
            // Set up change event listener
            const handleFunnelSortChangeEvent = (event) => {
                const newValue = event.target.value;
                
                setLocalOptions(prev => {
                    const newOptions = {
                        ...prev,
                        funnelSort: newValue
                    };
                    if (onStylingChange) {
                        onStylingChange(newOptions);
                    }
                    return newOptions;
                });
            };
            
            funnelSortPicker.addEventListener('change', handleFunnelSortChangeEvent);
            return () => {
                funnelSortPicker.removeEventListener('change', handleFunnelSortChangeEvent);
            };
        }
    }, [onStylingChange]);

    // Sync funnel sort picker value
    useEffect(() => {
        if (funnelSortPickerRef.current && funnelSortPickerRef.current.value !== localOptions.funnelSort) {
            funnelSortPickerRef.current.value = localOptions.funnelSort;
        }
    }, [localOptions.funnelSort]);

    // Set up event listener for Scatter Point Shape picker
    useEffect(() => {
        const scatterPointShapePicker = scatterPointShapePickerRef.current;
        if (scatterPointShapePicker) {
            // Update value if it changed
            if (scatterPointShapePicker.value !== localOptions.scatterPointShape) {
                scatterPointShapePicker.value = localOptions.scatterPointShape;
            }
            
            // Set up change event listener
            const handleScatterPointShapeChangeEvent = (event) => {
                const newValue = event.target.value;
                
                setLocalOptions(prev => {
                    const newOptions = {
                        ...prev,
                        scatterPointShape: newValue
                    };
                    if (onStylingChange) {
                        onStylingChange(newOptions);
                    }
                    return newOptions;
                });
            };
            
            scatterPointShapePicker.addEventListener('change', handleScatterPointShapeChangeEvent);
            return () => {
                scatterPointShapePicker.removeEventListener('change', handleScatterPointShapeChangeEvent);
            };
        }
    }, [onStylingChange]);

    // Sync scatter point shape picker value
    useEffect(() => {
        if (scatterPointShapePickerRef.current && scatterPointShapePickerRef.current.value !== localOptions.scatterPointShape) {
            scatterPointShapePickerRef.current.value = localOptions.scatterPointShape;
        }
    }, [localOptions.scatterPointShape]);

    // Sync other picker values
    useEffect(() => {
        if (scatterSortPickerRef.current) {
            scatterSortPickerRef.current.value = localOptions.scatterSort;
        }
        if (scatterLabelPositionPickerRef.current) {
            scatterLabelPositionPickerRef.current.value = localOptions.scatterLabelPosition;
        }
        if (radarShapePickerRef.current) {
            radarShapePickerRef.current.value = localOptions.radarShape;
        }
    }, [localOptions.scatterSort, localOptions.scatterLabelPosition, localOptions.radarShape]);

    // Set up event listener for Radar Shape picker
    useEffect(() => {
        const radarShapePicker = radarShapePickerRef.current;
        if (radarShapePicker) {
            if (radarShapePicker.value !== localOptions.radarShape) {
                radarShapePicker.value = localOptions.radarShape;
            }
            
            const handleRadarShapeChangeEvent = (event) => {
                const newShape = event.target.value;
                setLocalOptions(prev => {
                    const newOptions = {
                        ...prev,
                        radarShape: newShape
                    };
                    if (onStylingChange) {
                        onStylingChange(newOptions);
                    }
                    return newOptions;
                });
            };
            
            radarShapePicker.addEventListener('change', handleRadarShapeChangeEvent);
            return () => {
                radarShapePicker.removeEventListener('change', handleRadarShapeChangeEvent);
            };
        }
    }, [localOptions.radarShape, onStylingChange]);

    const handleToggle = (key) => {
        const newOptions = {
            ...localOptions,
            [key]: !localOptions[key]
        };
        setLocalOptions(newOptions);
        if (onStylingChange) {
            onStylingChange(newOptions);
        }
    };

    const handleChange = (key, value) => {
        const newOptions = {
            ...localOptions,
            [key]: value
        };
        
        setLocalOptions(newOptions);
        if (onStylingChange) {
            
            onStylingChange(newOptions);
        }
    };

    const handleFontFamilyChange = (event) => {
        const newFontFamily = event.target.value;
        
        handleChange('fontFamily', newFontFamily);
    };

    const handleFontStyleChange = (event) => {
        const newFontStyle = event.target.value;
        
        handleChange('fontStyle', newFontStyle);
    };

    const handleFontWeightChange = (event) => {
        const value = parseInt(event.target.value, 10);
        if (isNaN(value)) return;
        const clampedValue = Math.max(100, Math.min(900, value));
        handleChange('fontWeight', clampedValue);
    };

    const handleFontSizeChange = (event) => {
        const value = parseInt(event.target.value, 10);
        if (isNaN(value)) return;
        const clampedValue = Math.max(10, Math.min(30, value));
        handleChange('fontSize', clampedValue);
    };

    const handleSliderChange = (key, min, max) => (event) => {
        const value = parseFloat(event.target.value);
        if (isNaN(value)) return;
        const clampedValue = Math.max(min, Math.min(max, value));
        handleChange(key, clampedValue);
    };

    // Custom handler for inner radius to ensure it doesn't exceed outer radius
    const handleInnerRadiusChange = (event) => {
        const value = parseFloat(event.target.value);
        if (isNaN(value)) return;
        const currentOuterRadius = localOptions.outerRadius;
        const baseMin = 0;
        const maxInnerRadius = currentOuterRadius - 1; // Ensure inner is always less than outer
        const clampedValue = Math.max(baseMin, Math.min(maxInnerRadius, value));
        handleChange('innerRadius', clampedValue);
    };

    // Custom handler for outer radius to ensure it's not less than inner radius
    const handleOuterRadiusChange = (event) => {
        const value = parseFloat(event.target.value);
        if (isNaN(value)) return;
        const currentInnerRadius = localOptions.innerRadius;
        const baseMin = chartType === 'pie-nightingale' ? 60 : 30;
        const baseMax = chartType === 'pie-nightingale' ? 120 : 100;
        const minOuterRadius = Math.max(baseMin, currentInnerRadius + 1); // Ensure outer is always greater than inner
        const clampedValue = Math.max(minOuterRadius, Math.min(baseMax, value));
        handleChange('outerRadius', clampedValue);
    };

    const handlePickerChange = (key) => (event) => {
        handleChange(key, event.target.value);
    };

    const handleReset = (key, defaultValue) => {
        handleChange(key, defaultValue);
    };

    const RefreshIcon = ({ onClick, title = "Reset to default" }) => (
        <button
            className="refresh-icon-button"
            onClick={onClick}
            title={title}
            type="button"
        >
            <sp-icon-refresh size="s"></sp-icon-refresh>
        </button>
    );

    return (
        <div className="chart-styling-options">
            {/* Common Options - Always Visible */}
            <div className="styling-section">
                <h3 className="styling-section-title">Text Visibility</h3>
                <div className="toggle-group">
                    <div className="toggle-item">
                        <label className="toggle-label">Label</label>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={localOptions.labelVisible}
                                onChange={() => handleToggle('labelVisible')}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>
                    <div className="toggle-item">
                        <label className="toggle-label">Value</label>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={localOptions.valueVisible}
                                onChange={() => handleToggle('valueVisible')}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>
                </div>
            </div>

            <div className="styling-section">
                <h3 className="styling-section-title">
                    Font Family
                    <RefreshIcon onClick={() => handleReset('fontFamily', 'Arial')} />
                </h3>
                <sp-picker
                    ref={fontFamilyPickerRef}
                    label="Font Family"
                    value={localOptions.fontFamily}
                    className="styling-picker"
                >
                    {fontFamilies.map((font) => (
                        <sp-menu-item key={font.value} value={font.value}>
                            {font.label}
                        </sp-menu-item>
                    ))}
                </sp-picker>
            </div>

            <div className="styling-section">
                <h3 className="styling-section-title">
                    Font Style
                    <RefreshIcon onClick={() => handleReset('fontStyle', 'normal')} />
                </h3>
                <sp-picker
                    ref={fontStylePickerRef}
                    label="Font Style"
                    value={localOptions.fontStyle}
                    className="styling-picker"
                >
                    {fontStyles.map((style) => (
                        <sp-menu-item key={style.value} value={style.value}>
                            {style.label}
                        </sp-menu-item>
                    ))}
                </sp-picker>
            </div>

            <div className="styling-section">
                <h3 className="styling-section-title">
                    Font Weight
                    {localOptions.fontStyle !== 'bold' && (
                        <RefreshIcon onClick={() => handleReset('fontWeight', 400)} />
                    )}
                </h3>
                <div className="slider-group">
                    <input
                        type="range"
                        min={100}
                        max={900}
                        step={100}
                        value={localOptions.fontWeight}
                        onChange={handleFontWeightChange}
                        className="styling-slider"
                        disabled={localOptions.fontStyle === 'bold'}
                    />
                    <input
                        type="number"
                        value={localOptions.fontWeight.toString()}
                        min={100}
                        max={900}
                        step={100}
                        onChange={handleFontWeightChange}
                        className="styling-input"
                        disabled={localOptions.fontStyle === 'bold'}
                    />
                </div>
            </div>

            <div className="styling-section">
                <h3 className="styling-section-title">
                    Font Size
                    <RefreshIcon onClick={() => handleReset('fontSize', 12)} />
                </h3>
                <div className="slider-group">
                    <input
                        type="range"
                        min={10}
                        max={30}
                        step={1}
                        value={localOptions.fontSize}
                        onChange={handleFontSizeChange}
                        className="styling-slider"
                    />
                    <input
                        type="number"
                        value={localOptions.fontSize.toString()}
                        min={10}
                        max={30}
                        step={1}
                        onChange={handleFontSizeChange}
                        className="styling-input"
                    />
                </div>
            </div>

            {/* Axis Options - For axis-based charts */}
            {hasAxis && (
                <>
                    <div className="styling-section">
                        <h3 className="styling-section-title">
                            X-Axis Label Rotation
                            <RefreshIcon onClick={() => handleReset('xAxisRotation', 0)} />
                        </h3>
                        <sp-picker
                            ref={xAxisRotationPickerRef}
                            label="X-Axis Rotation"
                            value={localOptions.xAxisRotation.toString()}
                            className="styling-picker"
                        >
                            {rotationOptions.map((option) => (
                                <sp-menu-item key={option.value} value={option.value.toString()}>
                                    {option.label}
                                </sp-menu-item>
                            ))}
                        </sp-picker>
                    </div>

                    <div className="styling-section">
                        <h3 className="styling-section-title">
                            Y-Axis Label Rotation
                            <RefreshIcon onClick={() => handleReset('yAxisRotation', 0)} />
                        </h3>
                        <sp-picker
                            ref={yAxisRotationPickerRef}
                            label="Y-Axis Rotation"
                            value={localOptions.yAxisRotation.toString()}
                            className="styling-picker"
                        >
                            {rotationOptions.map((option) => (
                                <sp-menu-item key={option.value} value={option.value.toString()}>
                                    {option.label}
                                </sp-menu-item>
                            ))}
                        </sp-picker>
                    </div>
                </>
            )}

            {/* Line/Area Chart Options */}
            {isLineChart && (
                <>
                    <div className="styling-section">
                        <h3 className="styling-section-title">
                            Line Width
                            <RefreshIcon onClick={() => handleReset('lineWidth', 3)} />
                        </h3>
                        <div className="slider-group">
                            <input
                                type="range"
                                min={1}
                                max={10}
                                step={1}
                                value={localOptions.lineWidth}
                                onChange={handleSliderChange('lineWidth', 1, 10)}
                                className="styling-slider"
                            />
                            <input
                                type="number"
                                value={localOptions.lineWidth.toString()}
                                min={1}
                                max={10}
                                step={1}
                                onChange={handleSliderChange('lineWidth', 1, 10)}
                                className="styling-input"
                            />
                        </div>
                    </div>

                    <div className="styling-section">
                        <h3 className="styling-section-title">Line Options</h3>
                        <div className="toggle-group">
                            <div className="toggle-item">
                                <label className="toggle-label">Smooth Line</label>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={localOptions.lineSmooth}
                                        onChange={() => handleToggle('lineSmooth')}
                                    />
                                    <span className="slider"></span>
                                </label>
                            </div>
                            <div className="toggle-item">
                                <label className="toggle-label">Show Data Points</label>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={localOptions.showDataPoints}
                                        onChange={() => handleToggle('showDataPoints')}
                                    />
                                    <span className="slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {localOptions.showDataPoints && (
                        <div className="styling-section">
                            <h3 className="styling-section-title">
                                Point Size
                                <RefreshIcon onClick={() => handleReset('pointSize', 8)} />
                            </h3>
                            <div className="slider-group">
                                <input
                                    type="range"
                                    min={5}
                                    max={20}
                                    step={1}
                                    value={localOptions.pointSize}
                                    onChange={handleSliderChange('pointSize', 5, 20)}
                                    className="styling-slider"
                                />
                                <input
                                    type="number"
                                    value={localOptions.pointSize.toString()}
                                    min={5}
                                    max={20}
                                    step={1}
                                    onChange={handleSliderChange('pointSize', 5, 20)}
                                    className="styling-input"
                                />
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Bar Chart Options */}
            {isBarChart && (
                <>
                    <div className="styling-section">
                        <h3 className="styling-section-title">
                            Bar Width
                            <RefreshIcon onClick={() => handleReset('barWidth', 60)} />
                        </h3>
                        <div className="slider-group">
                            <input
                                type="range"
                                min={10}
                                max={100}
                                step={5}
                                value={localOptions.barWidth}
                                onChange={handleSliderChange('barWidth', 10, 100)}
                                className="styling-slider"
                            />
                            <input
                                type="number"
                                value={localOptions.barWidth.toString()}
                                min={10}
                                max={100}
                                step={5}
                                onChange={handleSliderChange('barWidth', 10, 100)}
                                className="styling-input"
                            />
                        </div>
                    </div>

                    <div className="styling-section">
                        <h3 className="styling-section-title">
                            Bar Border Radius
                            <RefreshIcon onClick={() => handleReset('barBorderRadius', 4)} />
                        </h3>
                        <div className="slider-group">
                            <input
                                type="range"
                                min={0}
                                max={20}
                                step={1}
                                value={localOptions.barBorderRadius}
                                onChange={handleSliderChange('barBorderRadius', 0, 20)}
                                className="styling-slider"
                            />
                            <input
                                type="number"
                                value={localOptions.barBorderRadius.toString()}
                                min={0}
                                max={20}
                                step={1}
                                onChange={handleSliderChange('barBorderRadius', 0, 20)}
                                className="styling-input"
                            />
                        </div>
                    </div>

                </>
            )}

            {/* Pie Chart Options */}
            {isPieChart && (
                <>
                    <div className="styling-section">
                        <h3 className="styling-section-title">
                            Inner Radius
                            <RefreshIcon onClick={() => handleReset('innerRadius', chartType === 'pie-nightingale' ? 0 : 20)} />
                        </h3>
                        <div className="slider-group">
                            <input
                                type="range"
                                min={0}
                                max={Math.max(0, localOptions.outerRadius - 1)}
                                step={chartType === 'pie-nightingale' ? 1 : 5}
                                value={localOptions.innerRadius}
                                onChange={handleInnerRadiusChange}
                                className="styling-slider"
                            />
                            <input
                                type="number"
                                value={localOptions.innerRadius.toString()}
                                min={0}
                                max={Math.max(0, localOptions.outerRadius - 1)}
                                step={chartType === 'pie-nightingale' ? 1 : 5}
                                onChange={handleInnerRadiusChange}
                                className="styling-input"
                            />
                        </div>
                    </div>

                    <div className="styling-section">
                        <h3 className="styling-section-title">
                            Outer Radius
                            <RefreshIcon onClick={() => handleReset('outerRadius', chartType === 'pie-nightingale' ? 100 : 40)} />
                        </h3>
                        <div className="slider-group">
                            <input
                                type="range"
                                min={Math.max(chartType === 'pie-nightingale' ? 60 : 30, localOptions.innerRadius + 1)}
                                max={chartType === 'pie-nightingale' ? 120 : 100}
                                step={chartType === 'pie-nightingale' ? 1 : 5}
                                value={localOptions.outerRadius}
                                onChange={handleOuterRadiusChange}
                                className="styling-slider"
                            />
                            <input
                                type="number"
                                value={localOptions.outerRadius.toString()}
                                min={Math.max(chartType === 'pie-nightingale' ? 60 : 30, localOptions.innerRadius + 1)}
                                max={chartType === 'pie-nightingale' ? 120 : 100}
                                step={chartType === 'pie-nightingale' ? 1 : 5}
                                onChange={handleOuterRadiusChange}
                                className="styling-input"
                            />
                        </div>
                    </div>

                    <div className="styling-section">
                        <h3 className="styling-section-title">
                            Label Line Length
                            <RefreshIcon onClick={() => handleReset('labelLineLength', 15)} />
                        </h3>
                        <div className="slider-group">
                            <input
                                type="range"
                                min={5}
                                max={50}
                                step={1}
                                value={localOptions.labelLineLength}
                                onChange={handleSliderChange('labelLineLength', 5, 50)}
                                className="styling-slider"
                            />
                            <input
                                type="number"
                                value={localOptions.labelLineLength.toString()}
                                min={5}
                                max={50}
                                step={1}
                                onChange={handleSliderChange('labelLineLength', 5, 50)}
                                className="styling-input"
                            />
                        </div>
                    </div>

                </>
            )}

            {/* Show Legend Toggle - Available for all charts */}
            <div className="styling-section">
                <h3 className="styling-section-title">Show Legend</h3>
                <div className="toggle-group">
                    <div className="toggle-item">
                        <label className="toggle-label">Legend</label>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={localOptions.showLegend}
                                onChange={() => handleToggle('showLegend')}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Radar Chart Options */}
            {isRadarChart && (
                <>
                    <div className="styling-section">
                        <h3 className="styling-section-title">
                            Radius
                            <RefreshIcon onClick={() => handleReset('radarRadius', 70)} />
                        </h3>
                        <div className="slider-group">
                            <input
                                type="range"
                                min={30}
                                max={90}
                                step={5}
                                value={localOptions.radarRadius}
                                onChange={handleSliderChange('radarRadius', 30, 90)}
                                className="styling-slider"
                            />
                            <input
                                type="number"
                                value={localOptions.radarRadius.toString()}
                                min={30}
                                max={90}
                                step={5}
                                onChange={handleSliderChange('radarRadius', 30, 90)}
                                className="styling-input"
                            />
                        </div>
                    </div>

                    <div className="styling-section">
                        <h3 className="styling-section-title">
                            Name Gap
                            <RefreshIcon onClick={() => handleReset('radarNameGap', 5)} />
                        </h3>
                        <div className="slider-group">
                            <input
                                type="range"
                                min={0}
                                max={20}
                                step={1}
                                value={localOptions.radarNameGap}
                                onChange={handleSliderChange('radarNameGap', 0, 20)}
                                className="styling-slider"
                            />
                            <input
                                type="number"
                                value={localOptions.radarNameGap.toString()}
                                min={0}
                                max={20}
                                step={1}
                                onChange={handleSliderChange('radarNameGap', 0, 20)}
                                className="styling-input"
                            />
                        </div>
                    </div>

                    <div className="styling-section">
                        <h3 className="styling-section-title">
                            Split Number
                            <RefreshIcon onClick={() => handleReset('radarSplitNumber', 5)} />
                        </h3>
                        <div className="slider-group">
                            <input
                                type="range"
                                min={3}
                                max={10}
                                step={1}
                                value={localOptions.radarSplitNumber}
                                onChange={handleSliderChange('radarSplitNumber', 3, 10)}
                                className="styling-slider"
                            />
                            <input
                                type="number"
                                value={localOptions.radarSplitNumber.toString()}
                                min={3}
                                max={10}
                                step={1}
                                onChange={handleSliderChange('radarSplitNumber', 3, 10)}
                                className="styling-input"
                            />
                        </div>
                    </div>

                    <div className="styling-section">
                        <h3 className="styling-section-title">
                            Shape
                            <RefreshIcon onClick={() => handleReset('radarShape', 'polygon')} />
                        </h3>
                        <div className="picker-group">
                            <sp-picker
                                ref={radarShapePickerRef}
                                label="Shape"
                                value={localOptions.radarShape}
                            >
                                <sp-menu-item value="polygon">Polygon</sp-menu-item>
                                <sp-menu-item value="circle">Circle</sp-menu-item>
                            </sp-picker>
                        </div>
                    </div>

                    <div className="styling-section">
                        <h3 className="styling-section-title">
                            Show Data Points
                            <RefreshIcon onClick={() => handleReset('showDataPoints', false)} />
                        </h3>
                        <div className="toggle-group">
                            <div className="toggle-item">
                                <label className="toggle-label">Data Points</label>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={localOptions.showDataPoints}
                                        onChange={() => handleToggle('showDataPoints')}
                                    />
                                    <span className="slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {localOptions.showDataPoints && (
                        <div className="styling-section">
                            <h3 className="styling-section-title">
                                Point Size
                                <RefreshIcon onClick={() => handleReset('pointSize', 8)} />
                            </h3>
                            <div className="slider-group">
                                <input
                                    type="range"
                                    min={5}
                                    max={20}
                                    step={1}
                                    value={localOptions.pointSize}
                                    onChange={handleSliderChange('pointSize', 5, 20)}
                                    className="styling-slider"
                                />
                                <input
                                    type="number"
                                    value={localOptions.pointSize.toString()}
                                    min={5}
                                    max={20}
                                    step={1}
                                    onChange={handleSliderChange('pointSize', 5, 20)}
                                    className="styling-input"
                                />
                            </div>
                        </div>
                    )}

                    <div className="styling-section">
                        <h3 className="styling-section-title">
                            Show Area
                            <RefreshIcon onClick={() => handleReset('radarShowArea', true)} />
                        </h3>
                        <div className="toggle-group">
                            <div className="toggle-item">
                                <label className="toggle-label">Area</label>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={localOptions.radarShowArea}
                                        onChange={() => handleToggle('radarShowArea')}
                                    />
                                    <span className="slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="styling-section">
                        <h3 className="styling-section-title">
                            Area Opacity
                            <RefreshIcon onClick={() => handleReset('radarAreaOpacity', 30)} />
                        </h3>
                        <div className="slider-group">
                            <input
                                type="range"
                                min={0}
                                max={100}
                                step={5}
                                value={localOptions.radarAreaOpacity}
                                onChange={handleSliderChange('radarAreaOpacity', 0, 100)}
                                className="styling-slider"
                            />
                            <input
                                type="number"
                                value={localOptions.radarAreaOpacity.toString()}
                                min={0}
                                max={100}
                                step={5}
                                onChange={handleSliderChange('radarAreaOpacity', 0, 100)}
                                className="styling-input"
                            />
                        </div>
                    </div>
                </>
            )}

            {/* Funnel Chart Options */}
            {isFunnelChart && (
                <>
                    <div className="styling-section">
                        <h3 className="styling-section-title">
                            Funnel Width
                            <RefreshIcon onClick={() => handleReset('funnelWidth', 80)} />
                        </h3>
                        <div className="slider-group">
                            <input
                                type="range"
                                min={50}
                                max={100}
                                step={5}
                                value={localOptions.funnelWidth}
                                onChange={handleSliderChange('funnelWidth', 50, 100)}
                                className="styling-slider"
                            />
                            <input
                                type="number"
                                value={localOptions.funnelWidth.toString()}
                                min={50}
                                max={100}
                                step={5}
                                onChange={handleSliderChange('funnelWidth', 50, 100)}
                                className="styling-input"
                            />
                        </div>
                    </div>

                    <div className="styling-section">
                        <h3 className="styling-section-title">
                            Gap Between Items
                            <RefreshIcon onClick={() => handleReset('funnelGap', 2)} />
                        </h3>
                        <div className="slider-group">
                            <input
                                type="range"
                                min={0}
                                max={10}
                                step={1}
                                value={localOptions.funnelGap}
                                onChange={handleSliderChange('funnelGap', 0, 10)}
                                className="styling-slider"
                            />
                            <input
                                type="number"
                                value={localOptions.funnelGap.toString()}
                                min={0}
                                max={10}
                                step={1}
                                onChange={handleSliderChange('funnelGap', 0, 10)}
                                className="styling-input"
                            />
                        </div>
                    </div>

                    <div className="styling-section">
                        <h3 className="styling-section-title">
                            Label Position
                            <RefreshIcon onClick={() => handleReset('funnelLabelPosition', 'inside')} />
                        </h3>
                        <sp-picker
                            ref={funnelLabelPositionPickerRef}
                            label="Label Position"
                            value={localOptions.funnelLabelPosition}
                            className="styling-picker"
                        >
                            {funnelLabelPositions.map((option) => (
                                <sp-menu-item key={option.value} value={option.value}>
                                    {option.label}
                                </sp-menu-item>
                            ))}
                        </sp-picker>
                    </div>

                    <div className="styling-section">
                        <h3 className="styling-section-title">
                            Sort Order
                            <RefreshIcon onClick={() => handleReset('funnelSort', 'descending')} />
                        </h3>
                        <sp-picker
                            ref={funnelSortPickerRef}
                            label="Sort Order"
                            value={localOptions.funnelSort}
                            className="styling-picker"
                        >
                            {funnelSortOptions.map((option) => (
                                <sp-menu-item key={option.value} value={option.value}>
                                    {option.label}
                                </sp-menu-item>
                            ))}
                        </sp-picker>
                    </div>
                </>
            )}

            {/* Scatter Chart Options */}
            {isScatterChart && (
                <>
                    <div className="styling-section">
                        <h3 className="styling-section-title">
                            Point Size
                            <RefreshIcon onClick={() => handleReset('scatterPointSize', 20)} />
                        </h3>
                        <div className="slider-group">
                            <input
                                type="range"
                                min={5}
                                max={50}
                                step={1}
                                value={localOptions.scatterPointSize}
                                onChange={handleSliderChange('scatterPointSize', 5, 50)}
                                className="styling-slider"
                            />
                            <input
                                type="number"
                                value={localOptions.scatterPointSize.toString()}
                                min={5}
                                max={50}
                                step={1}
                                onChange={handleSliderChange('scatterPointSize', 5, 50)}
                                className="styling-input"
                            />
                        </div>
                    </div>

                    <div className="styling-section">
                        <h3 className="styling-section-title">
                            Point Shape
                            <RefreshIcon onClick={() => handleReset('scatterPointShape', 'circle')} />
                        </h3>
                        <sp-picker
                            ref={scatterPointShapePickerRef}
                            label="Point Shape"
                            value={localOptions.scatterPointShape}
                            className="styling-picker"
                        >
                            {pointShapes.map((option) => (
                                <sp-menu-item key={option.value} value={option.value}>
                                    {option.label}
                                </sp-menu-item>
                            ))}
                        </sp-picker>
                    </div>

                    <div className="styling-section">
                        <h3 className="styling-section-title">Show Point Labels</h3>
                        <div className="toggle-group">
                            <div className="toggle-item">
                                <label className="toggle-label">Labels</label>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={localOptions.scatterShowLabels}
                                        onChange={() => handleToggle('scatterShowLabels')}
                                    />
                                    <span className="slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Area Chart Specific Options */}
            {isAreaChart && (
                    <div className="styling-section">
                        <h3 className="styling-section-title">
                            Area Opacity
                            <RefreshIcon onClick={() => handleReset('areaOpacity', 50)} />
                        </h3>
                        <div className="slider-group">
                        <input
                            type="range"
                            min={0}
                            max={100}
                            step={5}
                            value={localOptions.areaOpacity}
                            onChange={handleSliderChange('areaOpacity', 0, 100)}
                            className="styling-slider"
                        />
                        <input
                            type="number"
                            value={localOptions.areaOpacity.toString()}
                            min={0}
                            max={100}
                            step={5}
                            onChange={handleSliderChange('areaOpacity', 0, 100)}
                            className="styling-input"
                        />
                    </div>
                </div>
            )}
        </div>
    );
});

ChartStylingOptions.displayName = 'ChartStylingOptions';

export default ChartStylingOptions;
