// Reusable chart option generator
// This generates ECharts options based on chartType, theme, and data
// Used by both ChartPreview and CSVImportDialogContent

export const themeColors = {
  default: {
    backgroundColor: '#ffffff',
    textColor: '#333333',
    gridColor: '#e0e0e0',
    colors: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4']
  },
  vintage: {
    backgroundColor: '#fef8ef',
    textColor: '#6c5b4f',
    gridColor: '#e8dcc6',
    colors: ['#d87c7c', '#919e8b', '#d7ab82', '#6e7074', '#61a0a8', '#efa18d', '#787464', '#cc7e63']
  },
  dark: {
    backgroundColor: '#1e1e1e',
    textColor: '#e0e0e0',
    gridColor: '#404040',
    colors: ['#dd6b66', '#759aa0', '#e69d87', '#8dc1a9', '#ea7ccc', '#eedd78', '#73a373', '#73b9bc', '#7289ab', '#91ca8c', '#f49f42']
  },
  westeros: {
    backgroundColor: '#fffef0',
    textColor: '#516b91',
    gridColor: '#d3d3d3',
    colors: ['#516b91', '#59a4a3', '#84c7b0', '#a3d9b1', '#c7e89e', '#f0f9a4', '#f7d794', '#f5b87e', '#f29866', '#ee5a6f']
  },
  essos: {
    backgroundColor: '#fffef0',
    textColor: '#6e7079',
    gridColor: '#d3d3d3',
    colors: ['#893448', '#d95850', '#eb8146', '#ffb248', '#f2d643', '#ebdba4']
  },
  wonderland: {
    backgroundColor: '#fffef0',
    textColor: '#516b91',
    gridColor: '#d3d3d3',
    colors: ['#4ea397', '#22c3aa', '#7bd9a5', '#bff128', '#faff72', '#f9f26d', '#fad758', '#f9ca7b', '#f4a261', '#ee5a6f']
  },
  walden: {
    backgroundColor: '#fffef0',
    textColor: '#516b91',
    gridColor: '#d3d3d3',
    colors: ['#c12e34', '#e6b600', '#0098d9', '#2b821d', '#005eaa', '#339ca8', '#cda819', '#32a487']
  },
  chalk: {
    backgroundColor: '#293441',
    textColor: '#b9b8ce',
    gridColor: '#3e4a5b',
    colors: ['#fc97af', '#87f7cf', '#f7f494', '#72ccff', '#f7c5a0', '#d4a4eb', '#d2f5a6', '#76f2f2']
  },
  infographic: {
    backgroundColor: '#ffffff',
    textColor: '#333333',
    gridColor: '#e0e0e0',
    colors: ['#C1232B', '#B5C334', '#FCCE10', '#E87C25', '#27727B', '#FE8463', '#9BCA63', '#FAD860', '#F3A43B', '#60C0DD', '#D7504B', '#C6E579', '#F4E001', '#F0805A', '#26C0C0']
  }
};

/**
 * Generates ECharts option configuration based on chart type, theme, and data
 * @param {string} chartType - Type of chart (bar, line, pie, etc.)
 * @param {string} theme - Theme name (default, dark, vintage, etc.)
 * @param {Object} data - Data object with labels and values arrays
 * @param {Object} stylingOptions - Optional styling options
 * @returns {Object} ECharts option configuration
 */
export const generateChartOption = (chartType, theme, data, stylingOptions = {}) => {
  const currentTheme = themeColors[theme] || themeColors.default;
  
  const labels = data?.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const values = data?.values || [120, 200, 150, 80, 70, 110, 130];

  const showDataZoom = labels.length > 10;
  const dataZoomConfig = showDataZoom ? [
    {
      type: 'inside',
      xAxisIndex: 0,
      startValue: 0,
      endValue: 9
    },
    {
      type: 'slider',
      show: true,
      xAxisIndex: 0,
      bottom: 10,
      height: 15,
      handleSize: '80%',
      showDetail: false,
      startValue: 0,
      endValue: 9
    }
  ] : [];

  const verticalDataZoomConfig = showDataZoom ? [
    {
      type: 'inside',
      yAxisIndex: 0,
      startValue: 0,
      endValue: 9
    },
    {
      type: 'slider',
      show: true,
      yAxisIndex: 0,
      right: 10,
      width: 15,
      handleSize: '80%',
      showDetail: false,
      startValue: 0,
      endValue: 9
    }
  ] : [];

  const baseConfig = {
    backgroundColor: currentTheme.backgroundColor,
    textStyle: {
      color: currentTheme.textColor,
      fontFamily: stylingOptions?.fontFamily || 'Arial',
      fontSize: stylingOptions?.fontSize || 12,
      fontWeight: stylingOptions?.fontWeight || 400,
      fontStyle: stylingOptions?.fontStyle || 'normal'
    },
    tooltip: {
      backgroundColor: currentTheme.backgroundColor,
      borderColor: currentTheme.gridColor,
      textStyle: {
        color: currentTheme.textColor
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      top: '15%',
      bottom: showDataZoom ? '24%' : '15%',
      containLabel: true,
      borderColor: currentTheme.gridColor
    }
  };

  // Helper to get text style
  const getTextStyle = (defaultStyle = {}) => {
    return {
      ...defaultStyle,
      color: currentTheme.textColor,
      fontFamily: stylingOptions?.fontFamily || 'Arial',
      fontSize: stylingOptions?.fontSize || 12,
      fontWeight: stylingOptions?.fontWeight || 400,
      fontStyle: stylingOptions?.fontStyle || 'normal',
      show: stylingOptions?.labelVisible !== false && (defaultStyle.show !== false)
    };
  };

  // Generate chart based on chartType
  switch (chartType) {
    case 'bar':
      return {
        ...baseConfig,
        tooltip: {
          ...baseConfig.tooltip,
          trigger: 'axis',
          axisPointer: { type: 'shadow' }
        },
        xAxis: {
          type: 'category',
          data: labels,
          boundaryGap: true,
          axisLabel: {
            ...getTextStyle(),
            rotate: stylingOptions?.xAxisRotation ?? 0,
            hideOverlap: true
          },
          axisLine: { lineStyle: { color: currentTheme.gridColor } }
        },
        yAxis: {
          type: 'value',
          axisLabel: getTextStyle(),
          axisLine: { lineStyle: { color: currentTheme.gridColor } },
          splitLine: { lineStyle: { color: currentTheme.gridColor } }
        },
        dataZoom: dataZoomConfig,
        series: [{
          data: values,
          type: 'bar',
          barWidth: stylingOptions?.barWidth ? `${stylingOptions.barWidth}%` : undefined,
          itemStyle: {
            color: currentTheme.colors[0],
            borderRadius: stylingOptions?.barBorderRadius ?? 0
          }
        }]
      };

    case 'line':
      return {
        ...baseConfig,
        tooltip: {
          ...baseConfig.tooltip,
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          data: labels,
          boundaryGap: false,
          axisLabel: {
            ...getTextStyle(),
            rotate: stylingOptions?.xAxisRotation ?? 0,
            hideOverlap: true
          },
          axisLine: { lineStyle: { color: currentTheme.gridColor } }
        },
        yAxis: {
          type: 'value',
          axisLabel: getTextStyle(),
          axisLine: { lineStyle: { color: currentTheme.gridColor } },
          splitLine: { lineStyle: { color: currentTheme.gridColor } }
        },
        dataZoom: dataZoomConfig,
        series: [{
          data: values,
          type: 'line',
          smooth: stylingOptions?.lineSmooth !== false,
          lineWidth: stylingOptions?.lineWidth || 3,
          showSymbol: stylingOptions?.showDataPoints !== false,
          symbolSize: stylingOptions?.pointSize || 8,
          itemStyle: { color: currentTheme.colors[0] },
          lineStyle: { color: currentTheme.colors[0] }
        }]
      };

    case 'pie':
      return {
        ...baseConfig,
        tooltip: {
          ...baseConfig.tooltip,
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          type: 'scroll',
          data: labels,
          top: 0,
          show: stylingOptions?.showLegend !== false,
          textStyle: getTextStyle()
        },
        series: [{
          name: 'Data',
          type: 'pie',
          radius: `${stylingOptions?.outerRadius ?? 50}%`,
          data: labels.map((label, index) => ({
            value: values[index],
            name: label
          })),
          color: currentTheme.colors,
          label: {
            ...getTextStyle({ show: true }),
            formatter: (params) => {
              let result = '';
              if (stylingOptions?.labelVisible !== false) {
                result += params.name;
              }
              if (stylingOptions?.valueVisible !== false) {
                if (result) result += '\n';
                result += params.percent + '%';
              }
              return result || '';
            }
          }
        }]
      };

    case 'pie-nightingale':
      return {
        ...baseConfig,
        tooltip: {
          ...baseConfig.tooltip,
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          type: 'scroll',
          data: labels,
          top: 0,
          show: stylingOptions?.showLegend !== false,
          textStyle: getTextStyle()
        },
        series: [{
          name: 'Data',
          type: 'pie',
          radius: [stylingOptions?.innerRadius ?? 5, stylingOptions?.outerRadius ?? 60],
          center: ['50%', '50%'],
          roseType: 'area',
          data: labels.map((label, index) => ({
            value: values[index],
            name: label
          })),
          color: currentTheme.colors,
          label: {
            ...getTextStyle({ show: true }),
            formatter: (params) => {
              let result = '';
              if (stylingOptions?.labelVisible !== false) {
                result += params.name;
              }
              if (stylingOptions?.valueVisible !== false) {
                if (result) result += '\n';
                result += params.percent + '%';
              }
              return result || '';
            }
          }
        }]
      };

    case 'area':
      return {
        ...baseConfig,
        tooltip: {
          ...baseConfig.tooltip,
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          data: labels,
          boundaryGap: false,
          axisLabel: {
            ...getTextStyle(),
            rotate: stylingOptions?.xAxisRotation ?? 0,
            hideOverlap: true
          },
          axisLine: { lineStyle: { color: currentTheme.gridColor } }
        },
        yAxis: {
          type: 'value',
          axisLabel: getTextStyle(),
          axisLine: { lineStyle: { color: currentTheme.gridColor } },
          splitLine: { lineStyle: { color: currentTheme.gridColor } }
        },
        dataZoom: dataZoomConfig,
        series: [{
          data: values,
          type: 'line',
          smooth: stylingOptions?.lineSmooth !== false,
          areaStyle: {
            color: currentTheme.colors[0],
            opacity: (stylingOptions?.areaOpacity ?? 50) / 100
          },
          itemStyle: { color: currentTheme.colors[0] },
          lineStyle: { color: currentTheme.colors[0] }
        }]
      };

    case 'scatter':
      return {
        ...baseConfig,
        tooltip: {
          ...baseConfig.tooltip,
          trigger: 'item'
        },
        xAxis: {
          type: 'value',
          axisLabel: getTextStyle(),
          axisLine: { lineStyle: { color: currentTheme.gridColor } },
          splitLine: { lineStyle: { color: currentTheme.gridColor } }
        },
        yAxis: {
          type: 'value',
          axisLabel: getTextStyle(),
          axisLine: { lineStyle: { color: currentTheme.gridColor } },
          splitLine: { lineStyle: { color: currentTheme.gridColor } }
        },
        dataZoom: [
          {
            type: 'inside',
            xAxisIndex: 0
          },
          {
            type: 'inside',
            yAxisIndex: 0
          }
        ],
        series: [{
          data: labels.map((label, index) => [index, values[index]]),
          type: 'scatter',
          symbolSize: stylingOptions?.scatterPointSize || 20,
          itemStyle: { color: currentTheme.colors[0] }
        }]
      };

    case 'radar':
      const radarShowArea = stylingOptions?.radarShowArea !== false;
      return {
        ...baseConfig,
        tooltip: {
          ...baseConfig.tooltip,
          trigger: 'item'
        },
        radar: {
          indicator: labels.map((label, index) => ({
            name: label,
            max: Math.max(...values) * 1.2
          })),
          center: ['50%', '55%'],
          radius: `${stylingOptions?.radarRadius ?? 70}%`,
          nameGap: stylingOptions?.radarNameGap ?? 5,
          splitNumber: stylingOptions?.radarSplitNumber ?? 5,
          shape: stylingOptions?.radarShape || 'polygon',
          name: {
            ...getTextStyle(),
            fontSize: stylingOptions?.fontSize || 12
          },
          axisLine: {
            lineStyle: {
              color: currentTheme.gridColor
            }
          },
          splitLine: {
            lineStyle: {
              color: currentTheme.gridColor
            }
          },
          splitArea: {
            show: radarShowArea,
            areaStyle: {
              color: [
                currentTheme.gridColor + '20',
                currentTheme.gridColor + '10'
              ]
            }
          }
        },
        series: [{
          name: 'Data',
          type: 'radar',
          data: [{
            value: values,
            name: 'Data',
            areaStyle: radarShowArea ? {
              opacity: (stylingOptions?.radarAreaOpacity ?? 30) / 100
            } : undefined,
            lineStyle: {
              width: stylingOptions?.lineWidth || 3,
              color: currentTheme.colors[0]
            },
            itemStyle: {
              color: currentTheme.colors[0]
            },
            symbol: stylingOptions?.showDataPoints ? 'circle' : 'none',
            symbolSize: stylingOptions?.showDataPoints ? (stylingOptions?.pointSize || 8) : 0,
            label: stylingOptions?.valueVisible !== false ? {
              show: true,
              color: currentTheme.textColor,
              fontFamily: stylingOptions?.fontFamily || 'Arial',
              fontSize: stylingOptions?.fontSize || 12,
              fontWeight: stylingOptions?.fontWeight || 400,
              fontStyle: stylingOptions?.fontStyle || 'normal',
              position: 'top',
              formatter: '{c}'
            } : {
              show: false
            }
          }]
        }]
      };

    case 'funnel':
      return {
        ...baseConfig,
        tooltip: {
          ...baseConfig.tooltip,
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c}'
        },
        legend: {
          type: 'scroll',
          data: labels,
          top: 0,
          textStyle: getTextStyle()
        },
        series: [{
          name: 'Data',
          type: 'funnel',
          left: '10%',
          top: 60,
          bottom: 60,
          width: '80%',
          min: 0,
          max: Math.max(...values),
          minSize: '0%',
          maxSize: '100%',
          sort: stylingOptions?.funnelSort || 'descending',
          gap: stylingOptions?.funnelGap || 2,
          label: {
            show: true,
            position: stylingOptions?.funnelLabelPosition || 'inside',
            color: currentTheme.textColor
          },
          data: labels.map((label, index) => ({
            value: values[index],
            name: label,
            itemStyle: { color: currentTheme.colors[index % currentTheme.colors.length] }
          }))
        }]
      };

    case 'bar-horizontal':
      return {
        ...baseConfig,
        tooltip: {
          ...baseConfig.tooltip,
          trigger: 'axis',
          axisPointer: { type: 'shadow' }
        },
        grid: {
          ...baseConfig.grid,
          bottom: '15%',
          right: showDataZoom ? '15%' : '4%'
        },
        xAxis: {
          type: 'value',
          axisLabel: getTextStyle(),
          axisLine: { lineStyle: { color: currentTheme.gridColor } },
          splitLine: { lineStyle: { color: currentTheme.gridColor } }
        },
        yAxis: {
          type: 'category',
          data: labels,
          axisLabel: {
            ...getTextStyle(),
            hideOverlap: true
          },
          axisLine: { lineStyle: { color: currentTheme.gridColor } }
        },
        dataZoom: verticalDataZoomConfig,
        series: [{
          data: values,
          type: 'bar',
          barWidth: stylingOptions?.barWidth ? `${stylingOptions.barWidth}%` : undefined,
          itemStyle: {
            color: currentTheme.colors[0],
            borderRadius: stylingOptions?.barBorderRadius ?? 0
          }
        }]
      };

    case 'mixed':
      return {
        ...baseConfig,
        tooltip: {
          ...baseConfig.tooltip,
          trigger: 'axis'
        },
        legend: {
          type: 'scroll',
          data: ['Bar', 'Line'],
          top: 0,
          textStyle: getTextStyle()
        },
        xAxis: {
          type: 'category',
          data: labels,
          axisLabel: {
            ...getTextStyle(),
            rotate: stylingOptions?.xAxisRotation ?? 0,
            hideOverlap: true
          },
          axisLine: { lineStyle: { color: currentTheme.gridColor } }
        },
        yAxis: {
          type: 'value',
          axisLabel: getTextStyle(),
          axisLine: { lineStyle: { color: currentTheme.gridColor } },
          splitLine: { lineStyle: { color: currentTheme.gridColor } }
        },
        dataZoom: dataZoomConfig,
        series: [
          {
            name: 'Bar',
            type: 'bar',
            data: values,
            itemStyle: { color: currentTheme.colors[0] }
          },
          {
            name: 'Line',
            type: 'line',
            data: values,
            itemStyle: { color: currentTheme.colors[1] },
            lineStyle: { color: currentTheme.colors[1] }
          }
        ]
      };

    default:
      // Default to bar chart
      return {
        ...baseConfig,
        tooltip: {
          ...baseConfig.tooltip,
          trigger: 'axis',
          axisPointer: { type: 'shadow' }
        },
        xAxis: {
          type: 'category',
          data: labels,
          axisLabel: {
            ...getTextStyle(),
            hideOverlap: true
          },
          axisLine: { lineStyle: { color: currentTheme.gridColor } }
        },
        yAxis: {
          type: 'value',
          axisLabel: getTextStyle(),
          axisLine: { lineStyle: { color: currentTheme.gridColor } },
          splitLine: { lineStyle: { color: currentTheme.gridColor } }
        },
        dataZoom: dataZoomConfig,
        series: [{
          data: values,
          type: 'bar',
          itemStyle: { color: currentTheme.colors[0] }
        }]
      };
  }
};


