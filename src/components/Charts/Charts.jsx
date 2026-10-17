import React, { useState, useRef, useCallback } from 'react';
import * as echarts from 'echarts';
import ChartPicker from './ChartPicker';
import ChartPreview from './ChartPreview';
import ChartActions from './ChartActions';
import { themeColors } from './ChartOptionGenerator';
import './Charts.css';

const Charts = React.memo(({ sandboxProxy, selectedTheme = 'light' }) => {
    const [selectedChart, setSelectedChart] = useState('bar');
    const [isAdding, setIsAdding] = useState(false);
    const chartRef = useRef(null);

    // Log when Charts component renders
    

    const handleChartRef = useCallback((ref) => {
        if (ref && ref.current) {
            chartRef.current = ref.current;
        }
    }, []);

    const handleChartChange = useCallback((value) => {
        setSelectedChart(value);
    }, []);

    const handleAddToPage = useCallback(async () => {
        if (!sandboxProxy) {
            alert("Please wait for the add-on to initialize.");
            return;
        }

        if (!chartRef.current) {
            alert("Chart not ready. Please wait a moment and try again.");
            return;
        }

        setIsAdding(true);
        try {
            
            // Get the ECharts instance
            const echartsInstance = chartRef.current.getEchartsInstance();
            if (!echartsInstance) {
                throw new Error("Failed to get ECharts instance");
            }

            // Get current chart option to check backgroundColor
            const currentOption = echartsInstance.getOption();
            
            // Determine background color: transparent ONLY for default theme, otherwise use theme's background color
            // Use chart option's backgroundColor as source of truth since ChartPreview sets it correctly based on theme
            const chartOptionBackgroundColor = currentOption.backgroundColor;
            let exportBackgroundColor;
            
            // Default theme uses '#ffffff' in the chart option, but we want transparent for export
            // For all other themes, use the chart option's backgroundColor (which is already correct)
            if (chartOptionBackgroundColor === '#ffffff') {
                // This is the default theme - use transparent for export
                exportBackgroundColor = 'transparent';
            } else {
                // For all other themes, use the chart option's backgroundColor (already set correctly by ChartPreview)
                exportBackgroundColor = chartOptionBackgroundColor || '#ffffff';
            }

            // Create a temporary off-screen container
            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            container.style.top = '-9999px';
            
            // Calculate dynamic width/height based on the number of categories
            // Support both ECharts config formats (axis as array of objects or single object)
            let xAxisData = null;
            if (currentOption.xAxis) {
                if (Array.isArray(currentOption.xAxis)) {
                    xAxisData = currentOption.xAxis[0]?.data;
                } else {
                    xAxisData = currentOption.xAxis.data;
                }
            }
            
            let yAxisData = null;
            if (currentOption.yAxis) {
                if (Array.isArray(currentOption.yAxis)) {
                    yAxisData = currentOption.yAxis[0]?.data;
                } else {
                    yAxisData = currentOption.yAxis.data;
                }
            }
            
            let seriesData = null;
            if (currentOption.series) {
                if (Array.isArray(currentOption.series)) {
                    seriesData = currentOption.series[0]?.data;
                } else {
                    seriesData = currentOption.series.data;
                }
            }
            
            const categoryCount = (xAxisData && xAxisData.length) || 
                                  (yAxisData && yAxisData.length) || 
                                  (seriesData && seriesData.length) || 10;
            
            // Check if chart type is horizontal
            let isHorizontal = false;
            if (currentOption.yAxis) {
                if (Array.isArray(currentOption.yAxis)) {
                    isHorizontal = currentOption.yAxis[0]?.type === 'category';
                } else {
                    isHorizontal = currentOption.yAxis.type === 'category';
                }
            }
            
            let exportWidth = 1200;
            let exportHeight = 800;
            
            if (isHorizontal) {
                // Horizontal bar chart: scale height dynamically so bars have room
                exportHeight = Math.max(800, categoryCount * 40 + 150);
                exportWidth = 1200;
            } else {
                // Vertical charts: scale width dynamically so columns have room
                exportWidth = Math.max(1200, categoryCount * 60 + 150);
                exportHeight = 800;
            }
            
            container.style.width = `${exportWidth}px`;
            container.style.height = `${exportHeight}px`;
            document.body.appendChild(container);
            
            // Initialize temporary off-screen chart
            const tempChart = echarts.init(container, null, { devicePixelRatio: 3 });
            
            // Clean up the option for full export
            const exportOption = { ...currentOption };
            
            // Disable animations for instant, complete rendering during export
            exportOption.animation = false;
            
            // Reset dataZoom to show full range and hide the slider UI
            if (Array.isArray(exportOption.dataZoom)) {
                exportOption.dataZoom = exportOption.dataZoom.map(dz => {
                    const newDz = { ...dz };
                    newDz.show = false;
                    newDz.start = 0;
                    newDz.end = 100;
                    delete newDz.startValue;
                    delete newDz.endValue;
                    return newDz;
                });
            }
            
            // Adjust margins back to standard since dataZoom slider is hidden
            if (Array.isArray(exportOption.grid)) {
                exportOption.grid = exportOption.grid.map(g => ({
                    ...g,
                    bottom: '15%',
                    right: '4%'
                }));
            } else if (exportOption.grid) {
                exportOption.grid = {
                    ...exportOption.grid,
                    bottom: '15%',
                    right: '4%'
                };
            }
            
            tempChart.setOption(exportOption);
            
            // Wait a short moment for instant rendering to finish layout
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Export chart as data URL (PNG format)
            const dataUrl = tempChart.getDataURL({
                type: 'png',
                pixelRatio: 1, // devicePixelRatio is already set to 3 on init
                backgroundColor: exportBackgroundColor
            });
            
            // Clean up
            tempChart.dispose();
            document.body.removeChild(container);

            // Convert data URL to blob
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            
            // Use sandbox function to add chart to design
            const result = await sandboxProxy.addChartToDesign(blob);

            
        } catch (error) {
            console.error("❌ [Chart] Error adding chart to design:", error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsAdding(false);
        }
    }, [sandboxProxy, selectedTheme]);

    return (
        <div className="charts-container">
            <ChartPicker 
                selectedChart={selectedChart}
                onChartChange={handleChartChange}
            />
            <ChartPreview 
                chartType={selectedChart}
                theme={selectedTheme}
                onChartRef={handleChartRef}
            />
            <ChartActions 
                sandboxProxy={sandboxProxy}
                isAdding={isAdding}
                onAddToPage={handleAddToPage}
            />
        </div>
    );
});

Charts.displayName = 'Charts';

// Custom comparison - only re-render if sandboxProxy or selectedTheme changes
export default React.memo(Charts, (prevProps, nextProps) => {
    return prevProps.sandboxProxy === nextProps.sandboxProxy &&
           prevProps.selectedTheme === nextProps.selectedTheme;
});
