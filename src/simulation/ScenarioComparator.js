/**
 * 场景比较器 - 实现多个仿真场景的并行管理和比较分析
 * ScenarioComparator - Implement parallel management and comparison analysis of multiple simulation scenarios
 */
import * as THREE from 'three';

export class ScenarioComparator {
  /**
   * 构造函数 - 初始化场景比较器
   * Constructor - Initialize scenario comparator
   * @param {SceneManager} sceneManager - 场景管理器
   */
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
    
    // 场景管理
    this.scenarios = new Map(); // 存储所有场景
    this.simulationResults = new Map(); // 存储仿真结果
    this.activeComparisons = new Map(); // 活跃的比较任务
    
    // 比较分析配置
    this.comparisonMetrics = [
      'maxSpeed',
      'averageSpeed', 
      'totalDistance',
      'totalEnergyConsumption',
      'maxAcceleration',
      'energyEfficiency'
    ];
    
    // 可视化元素
    this.comparisonVisualization = {
      charts: new Map(),
      heatmaps: new Map(),
      trajectoryOverlays: new Map()
    };
    
    // 分析工具
    this.analysisTools = {
      statisticalAnalysis: null,
      trendAnalysis: null,
      correlationAnalysis: null
    };
    
    this.initializeComparator();
  }

  /**
   * 初始化比较器
   * Initialize comparator
   */
  initializeComparator() {
    // 创建比较结果显示面板
    this.createComparisonPanel();
    
    // 初始化分析工具
    this.initializeAnalysisTools();
  }

  /**
   * 添加场景进行比较
   * Add scenario for comparison
   * @param {string} scenarioId - 场景ID
   * @param {Object} scenarioConfig - 场景配置
   * @param {Object} simulationResult - 仿真结果
   * @returns {boolean} 添加是否成功
   */
  addScenarioForComparison(scenarioId, scenarioConfig, simulationResult) {
    try {
      // 验证输入参数
      if (!scenarioId || !scenarioConfig || !simulationResult) {
        throw new Error('缺少必要的参数');
      }
      
      // 存储场景信息
      this.scenarios.set(scenarioId, {
        id: scenarioId,
        config: scenarioConfig,
        addedTime: new Date(),
        status: 'ready'
      });
      
      // 存储仿真结果
      this.simulationResults.set(scenarioId, {
        ...simulationResult,
        scenarioId: scenarioId,
        processedTime: new Date()
      });
      
      console.log(`ScenarioComparator: 场景 ${scenarioId} 已添加到比较列表`);
      return true;
      
    } catch (error) {
      console.error('ScenarioComparator: 添加场景失败', error);
      return false;
    }
  }

  /**
   * 移除比较场景
   * Remove comparison scenario
   * @param {string} scenarioId - 场景ID
   * @returns {boolean} 移除是否成功
   */
  removeScenarioFromComparison(scenarioId) {
    const removed = this.scenarios.delete(scenarioId) && 
                   this.simulationResults.delete(scenarioId);
    
    if (removed) {
      // 清理相关的可视化元素
      this.clearScenarioVisualization(scenarioId);
      console.log(`ScenarioComparator: 场景 ${scenarioId} 已从比较列表移除`);
    }
    
    return removed;
  }

  /**
   * 执行场景比较分析
   * Execute scenario comparison analysis
   * @param {Array<string>} scenarioIds - 要比较的场景ID列表
   * @param {Object} comparisonOptions - 比较选项
   * @returns {Object} 比较结果
   */
  compareScenarios(scenarioIds, comparisonOptions = {}) {
    try {
      // 验证场景存在
      const validScenarios = scenarioIds.filter(id => 
        this.scenarios.has(id) && this.simulationResults.has(id)
      );
      
      if (validScenarios.length < 2) {
        throw new Error('至少需要两个有效场景进行比较');
      }
      
      // 执行比较分析
      const comparisonResult = {
        comparisonId: `comparison_${Date.now()}`,
        scenarioIds: validScenarios,
        timestamp: new Date(),
        metrics: this.calculateComparisonMetrics(validScenarios),
        analysis: this.performStatisticalAnalysis(validScenarios),
        visualization: this.generateComparisonVisualization(validScenarios),
        recommendations: this.generateRecommendations(validScenarios)
      };
      
      // 存储比较结果
      this.activeComparisons.set(comparisonResult.comparisonId, comparisonResult);
      
      console.log(`ScenarioComparator: 完成 ${validScenarios.length} 个场景的比较分析`);
      return comparisonResult;
      
    } catch (error) {
      console.error('ScenarioComparator: 场景比较失败', error);
      throw error;
    }
  }

  /**
   * 计算比较指标
   * Calculate comparison metrics
   * @param {Array<string>} scenarioIds - 场景ID列表
   * @returns {Object} 比较指标
   */
  calculateComparisonMetrics(scenarioIds) {
    const metrics = {};
    
    // 为每个指标计算统计数据
    this.comparisonMetrics.forEach(metricName => {
      const values = scenarioIds.map(id => {
        const result = this.simulationResults.get(id);
        return result.data?.performanceMetrics?.[metricName] || 0;
      });
      
      metrics[metricName] = {
        values: values,
        min: Math.min(...values),
        max: Math.max(...values),
        average: values.reduce((sum, val) => sum + val, 0) / values.length,
        standardDeviation: this.calculateStandardDeviation(values),
        range: Math.max(...values) - Math.min(...values),
        bestScenario: scenarioIds[values.indexOf(Math.max(...values))],
        worstScenario: scenarioIds[values.indexOf(Math.min(...values))]
      };
    });
    
    return metrics;
  }

  /**
   * 计算标准差
   * Calculate standard deviation
   * @param {Array<number>} values - 数值数组
   * @returns {number} 标准差
   */
  calculateStandardDeviation(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDifferences = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDifferences.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * 执行统计分析
   * Perform statistical analysis
   * @param {Array<string>} scenarioIds - 场景ID列表
   * @returns {Object} 统计分析结果
   */
  performStatisticalAnalysis(scenarioIds) {
    const analysis = {
      correlations: this.calculateCorrelations(scenarioIds),
      trends: this.analyzeTrends(scenarioIds),
      outliers: this.detectOutliers(scenarioIds),
      significance: this.testSignificance(scenarioIds)
    };
    
    return analysis;
  }

  /**
   * 计算相关性分析
   * Calculate correlation analysis
   * @param {Array<string>} scenarioIds - 场景ID列表
   * @returns {Object} 相关性分析结果
   */
  calculateCorrelations(scenarioIds) {
    const correlations = {};
    
    // 计算不同指标之间的相关性
    for (let i = 0; i < this.comparisonMetrics.length; i++) {
      for (let j = i + 1; j < this.comparisonMetrics.length; j++) {
        const metric1 = this.comparisonMetrics[i];
        const metric2 = this.comparisonMetrics[j];
        
        const values1 = scenarioIds.map(id => {
          const result = this.simulationResults.get(id);
          return result.data?.performanceMetrics?.[metric1] || 0;
        });
        
        const values2 = scenarioIds.map(id => {
          const result = this.simulationResults.get(id);
          return result.data?.performanceMetrics?.[metric2] || 0;
        });
        
        const correlation = this.calculatePearsonCorrelation(values1, values2);
        correlations[`${metric1}_${metric2}`] = {
          coefficient: correlation,
          strength: this.interpretCorrelationStrength(correlation)
        };
      }
    }
    
    return correlations;
  }

  /**
   * 计算皮尔逊相关系数
   * Calculate Pearson correlation coefficient
   * @param {Array<number>} x - X值数组
   * @param {Array<number>} y - Y值数组
   * @returns {number} 相关系数
   */
  calculatePearsonCorrelation(x, y) {
    const n = x.length;
    if (n !== y.length || n === 0) return 0;
    
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * 解释相关性强度
   * Interpret correlation strength
   * @param {number} correlation - 相关系数
   * @returns {string} 相关性强度描述
   */
  interpretCorrelationStrength(correlation) {
    const abs = Math.abs(correlation);
    if (abs >= 0.8) return '强相关';
    if (abs >= 0.6) return '中等相关';
    if (abs >= 0.3) return '弱相关';
    return '无相关';
  }

  /**
   * 分析趋势
   * Analyze trends
   * @param {Array<string>} scenarioIds - 场景ID列表
   * @returns {Object} 趋势分析结果
   */
  analyzeTrends(scenarioIds) {
    const trends = {};
    
    this.comparisonMetrics.forEach(metricName => {
      const values = scenarioIds.map(id => {
        const result = this.simulationResults.get(id);
        return result.data?.performanceMetrics?.[metricName] || 0;
      });
      
      // 简单的线性趋势分析
      const trend = this.calculateLinearTrend(values);
      trends[metricName] = {
        slope: trend.slope,
        direction: trend.slope > 0 ? '上升' : trend.slope < 0 ? '下降' : '平稳',
        strength: Math.abs(trend.slope)
      };
    });
    
    return trends;
  }

  /**
   * 计算线性趋势
   * Calculate linear trend
   * @param {Array<number>} values - 数值数组
   * @returns {Object} 趋势信息
   */
  calculateLinearTrend(values) {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
  }

  /**
   * 检测异常值
   * Detect outliers
   * @param {Array<string>} scenarioIds - 场景ID列表
   * @returns {Object} 异常值检测结果
   */
  detectOutliers(scenarioIds) {
    const outliers = {};
    
    this.comparisonMetrics.forEach(metricName => {
      const values = scenarioIds.map(id => {
        const result = this.simulationResults.get(id);
        return result.data?.performanceMetrics?.[metricName] || 0;
      });
      
      const { lowerBound, upperBound } = this.calculateOutlierBounds(values);
      const outlierIndices = values
        .map((val, index) => ({ value: val, index, scenarioId: scenarioIds[index] }))
        .filter(item => item.value < lowerBound || item.value > upperBound);
      
      outliers[metricName] = outlierIndices;
    });
    
    return outliers;
  }

  /**
   * 计算异常值边界
   * Calculate outlier bounds using IQR method
   * @param {Array<number>} values - 数值数组
   * @returns {Object} 异常值边界
   */
  calculateOutlierBounds(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;
    
    return {
      lowerBound: q1 - 1.5 * iqr,
      upperBound: q3 + 1.5 * iqr
    };
  }

  /**
   * 测试统计显著性
   * Test statistical significance
   * @param {Array<string>} scenarioIds - 场景ID列表
   * @returns {Object} 显著性测试结果
   */
  testSignificance(scenarioIds) {
    // 简化的显著性测试 - 在实际应用中可能需要更复杂的统计测试
    const significance = {};
    
    this.comparisonMetrics.forEach(metricName => {
      const values = scenarioIds.map(id => {
        const result = this.simulationResults.get(id);
        return result.data?.performanceMetrics?.[metricName] || 0;
      });
      
      const variance = this.calculateStandardDeviation(values) ** 2;
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      
      // 简单的变异系数作为显著性指标
      const coefficientOfVariation = variance > 0 ? Math.sqrt(variance) / mean : 0;
      
      significance[metricName] = {
        coefficientOfVariation: coefficientOfVariation,
        isSignificant: coefficientOfVariation > 0.1, // 10%阈值
        level: coefficientOfVariation > 0.2 ? '高' : coefficientOfVariation > 0.1 ? '中' : '低'
      };
    });
    
    return significance;
  }

  /**
   * 生成比较可视化
   * Generate comparison visualization
   * @param {Array<string>} scenarioIds - 场景ID列表
   * @returns {Object} 可视化配置
   */
  generateComparisonVisualization(scenarioIds) {
    const visualization = {
      charts: this.createComparisonCharts(scenarioIds),
      trajectoryOverlay: this.createTrajectoryOverlay(scenarioIds),
      heatmap: this.createPerformanceHeatmap(scenarioIds),
      radarChart: this.createRadarChart(scenarioIds)
    };
    
    return visualization;
  }

  /**
   * 创建比较图表
   * Create comparison charts
   * @param {Array<string>} scenarioIds - 场景ID列表
   * @returns {Object} 图表配置
   */
  createComparisonCharts(scenarioIds) {
    const charts = {};
    
    // 为每个指标创建柱状图
    this.comparisonMetrics.forEach(metricName => {
      const data = scenarioIds.map(id => {
        const result = this.simulationResults.get(id);
        const scenario = this.scenarios.get(id);
        return {
          scenarioId: id,
          scenarioName: scenario.config.name || id,
          value: result.data?.performanceMetrics?.[metricName] || 0
        };
      });
      
      charts[metricName] = {
        type: 'bar',
        title: `${metricName} 比较`,
        data: data,
        xAxis: 'scenarioName',
        yAxis: 'value'
      };
    });
    
    return charts;
  }

  /**
   * 创建轨迹叠加显示
   * Create trajectory overlay
   * @param {Array<string>} scenarioIds - 场景ID列表
   * @returns {Object} 轨迹叠加配置
   */
  createTrajectoryOverlay(scenarioIds) {
    const trajectories = scenarioIds.map((id, index) => {
      const result = this.simulationResults.get(id);
      const scenario = this.scenarios.get(id);
      
      return {
        scenarioId: id,
        scenarioName: scenario.config.name || id,
        trajectory: result.data?.trajectory || [],
        color: this.getScenarioColor(index),
        style: this.getScenarioLineStyle(index)
      };
    });
    
    return {
      type: 'trajectory_overlay',
      trajectories: trajectories,
      legend: true,
      grid: true
    };
  }

  /**
   * 创建性能热力图
   * Create performance heatmap
   * @param {Array<string>} scenarioIds - 场景ID列表
   * @returns {Object} 热力图配置
   */
  createPerformanceHeatmap(scenarioIds) {
    const heatmapData = [];
    
    scenarioIds.forEach((id, rowIndex) => {
      const result = this.simulationResults.get(id);
      const scenario = this.scenarios.get(id);
      
      this.comparisonMetrics.forEach((metricName, colIndex) => {
        const value = result.data?.performanceMetrics?.[metricName] || 0;
        heatmapData.push({
          x: colIndex,
          y: rowIndex,
          value: value,
          scenarioId: id,
          scenarioName: scenario.config.name || id,
          metricName: metricName
        });
      });
    });
    
    return {
      type: 'heatmap',
      data: heatmapData,
      xLabels: this.comparisonMetrics,
      yLabels: scenarioIds.map(id => this.scenarios.get(id).config.name || id),
      colorScale: 'viridis'
    };
  }

  /**
   * 创建雷达图
   * Create radar chart
   * @param {Array<string>} scenarioIds - 场景ID列表
   * @returns {Object} 雷达图配置
   */
  createRadarChart(scenarioIds) {
    const datasets = scenarioIds.map((id, index) => {
      const result = this.simulationResults.get(id);
      const scenario = this.scenarios.get(id);
      
      // 标准化数据到0-1范围
      const normalizedData = this.comparisonMetrics.map(metricName => {
        const value = result.data?.performanceMetrics?.[metricName] || 0;
        return this.normalizeValue(value, metricName, scenarioIds);
      });
      
      return {
        label: scenario.config.name || id,
        data: normalizedData,
        color: this.getScenarioColor(index),
        fill: true,
        fillOpacity: 0.2
      };
    });
    
    return {
      type: 'radar',
      labels: this.comparisonMetrics,
      datasets: datasets
    };
  }

  /**
   * 标准化数值
   * Normalize value to 0-1 range
   * @param {number} value - 原始值
   * @param {string} metricName - 指标名称
   * @param {Array<string>} scenarioIds - 场景ID列表
   * @returns {number} 标准化后的值
   */
  normalizeValue(value, metricName, scenarioIds) {
    const allValues = scenarioIds.map(id => {
      const result = this.simulationResults.get(id);
      return result.data?.performanceMetrics?.[metricName] || 0;
    });
    
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    
    return max === min ? 0.5 : (value - min) / (max - min);
  }

  /**
   * 获取场景颜色
   * Get scenario color
   * @param {number} index - 场景索引
   * @returns {string} 颜色值
   */
  getScenarioColor(index) {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
      '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
    ];
    return colors[index % colors.length];
  }

  /**
   * 获取场景线条样式
   * Get scenario line style
   * @param {number} index - 场景索引
   * @returns {string} 线条样式
   */
  getScenarioLineStyle(index) {
    const styles = ['solid', 'dashed', 'dotted', 'dashdot'];
    return styles[index % styles.length];
  }

  /**
   * 生成建议
   * Generate recommendations
   * @param {Array<string>} scenarioIds - 场景ID列表
   * @returns {Array<Object>} 建议列表
   */
  generateRecommendations(scenarioIds) {
    const recommendations = [];
    const metrics = this.calculateComparisonMetrics(scenarioIds);
    
    // 基于性能指标生成建议
    this.comparisonMetrics.forEach(metricName => {
      const metricData = metrics[metricName];
      const bestScenario = this.scenarios.get(metricData.bestScenario);
      const worstScenario = this.scenarios.get(metricData.worstScenario);
      
      if (metricData.range > metricData.average * 0.2) { // 如果差异显著
        recommendations.push({
          type: 'performance',
          priority: 'high',
          metric: metricName,
          title: `${metricName} 性能优化建议`,
          description: `场景 "${bestScenario.config.name}" 在 ${metricName} 方面表现最佳 (${metricData.max.toFixed(2)})，而场景 "${worstScenario.config.name}" 表现较差 (${metricData.min.toFixed(2)})。建议分析最佳场景的配置参数。`,
          bestScenario: metricData.bestScenario,
          worstScenario: metricData.worstScenario,
          improvement: ((metricData.max - metricData.min) / metricData.min * 100).toFixed(1) + '%'
        });
      }
    });
    
    // 基于相关性分析生成建议
    const analysis = this.performStatisticalAnalysis(scenarioIds);
    Object.entries(analysis.correlations).forEach(([key, correlation]) => {
      if (Math.abs(correlation.coefficient) > 0.7) {
        const [metric1, metric2] = key.split('_');
        recommendations.push({
          type: 'correlation',
          priority: 'medium',
          title: `${metric1} 与 ${metric2} 强相关`,
          description: `发现 ${metric1} 与 ${metric2} 之间存在${correlation.strength} (相关系数: ${correlation.coefficient.toFixed(3)})，优化其中一个指标可能会影响另一个。`,
          metrics: [metric1, metric2],
          correlation: correlation.coefficient
        });
      }
    });
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * 创建比较面板
   * Create comparison panel
   */
  createComparisonPanel() {
    const panel = document.createElement('div');
    panel.id = 'scenario-comparison-panel';
    panel.style.cssText = `
      position: fixed;
      top: 50px;
      left: 10px;
      width: 400px;
      max-height: 80vh;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 20px;
      border-radius: 10px;
      font-family: Arial, sans-serif;
      font-size: 12px;
      z-index: 1000;
      display: none;
      overflow-y: auto;
    `;
    
    panel.innerHTML = `
      <h3 style="margin: 0 0 15px 0; color: #00ff00;">场景比较分析</h3>
      <div id="comparison-scenarios">
        <h4>比较场景列表:</h4>
        <div id="scenario-list"></div>
      </div>
      <div id="comparison-metrics" style="margin-top: 15px;">
        <h4>性能指标对比:</h4>
        <div id="metrics-table"></div>
      </div>
      <div id="comparison-recommendations" style="margin-top: 15px;">
        <h4>优化建议:</h4>
        <div id="recommendations-list"></div>
      </div>
      <div style="margin-top: 15px;">
        <button id="export-comparison" style="background: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">导出比较报告</button>
        <button id="clear-comparison" style="background: #f44336; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-left: 10px;">清空比较</button>
      </div>
    `;
    
    document.body.appendChild(panel);
    this.comparisonPanel = panel;
    
    // 绑定事件
    document.getElementById('export-comparison').addEventListener('click', () => {
      this.exportComparisonReport();
    });
    
    document.getElementById('clear-comparison').addEventListener('click', () => {
      this.clearAllComparisons();
    });
  }

  /**
   * 更新比较面板
   * Update comparison panel
   * @param {Object} comparisonResult - 比较结果
   */
  updateComparisonPanel(comparisonResult) {
    if (!this.comparisonPanel) return;
    
    // 更新场景列表
    const scenarioList = document.getElementById('scenario-list');
    scenarioList.innerHTML = comparisonResult.scenarioIds.map(id => {
      const scenario = this.scenarios.get(id);
      return `<div style="margin: 5px 0; padding: 5px; background: rgba(255,255,255,0.1); border-radius: 3px;">
        ${scenario.config.name || id}
      </div>`;
    }).join('');
    
    // 更新指标表格
    const metricsTable = document.getElementById('metrics-table');
    const metricsHtml = this.comparisonMetrics.map(metricName => {
      const metricData = comparisonResult.metrics[metricName];
      return `
        <div style="margin: 8px 0; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 3px;">
          <strong>${metricName}:</strong><br>
          最佳: ${metricData.max.toFixed(2)} (${this.scenarios.get(metricData.bestScenario).config.name})<br>
          最差: ${metricData.min.toFixed(2)} (${this.scenarios.get(metricData.worstScenario).config.name})<br>
          平均: ${metricData.average.toFixed(2)}
        </div>
      `;
    }).join('');
    metricsTable.innerHTML = metricsHtml;
    
    // 更新建议列表
    const recommendationsList = document.getElementById('recommendations-list');
    const recommendationsHtml = comparisonResult.recommendations.slice(0, 5).map(rec => {
      const priorityColor = rec.priority === 'high' ? '#ff4444' : rec.priority === 'medium' ? '#ffaa44' : '#44ff44';
      return `
        <div style="margin: 8px 0; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 3px; border-left: 3px solid ${priorityColor};">
          <strong>${rec.title}</strong><br>
          <small>${rec.description}</small>
        </div>
      `;
    }).join('');
    recommendationsList.innerHTML = recommendationsHtml;
    
    // 显示面板
    this.comparisonPanel.style.display = 'block';
  }

  /**
   * 导出比较报告
   * Export comparison report
   */
  exportComparisonReport() {
    const activeComparison = Array.from(this.activeComparisons.values())[0];
    if (!activeComparison) {
      alert('没有可导出的比较结果');
      return;
    }
    
    const report = {
      title: '场景比较分析报告',
      timestamp: new Date().toISOString(),
      scenarios: activeComparison.scenarioIds.map(id => ({
        id: id,
        name: this.scenarios.get(id).config.name || id,
        config: this.scenarios.get(id).config
      })),
      metrics: activeComparison.metrics,
      analysis: activeComparison.analysis,
      recommendations: activeComparison.recommendations
    };
    
    // 创建下载链接
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scenario_comparison_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * 清空所有比较
   * Clear all comparisons
   */
  clearAllComparisons() {
    this.scenarios.clear();
    this.simulationResults.clear();
    this.activeComparisons.clear();
    
    // 隐藏面板
    if (this.comparisonPanel) {
      this.comparisonPanel.style.display = 'none';
    }
    
    // 清理可视化元素
    this.clearAllVisualization();
  }

  /**
   * 清理场景可视化
   * Clear scenario visualization
   * @param {string} scenarioId - 场景ID
   */
  clearScenarioVisualization(scenarioId) {
    // 清理相关的可视化元素
    Object.values(this.comparisonVisualization).forEach(visualMap => {
      if (visualMap instanceof Map) {
        visualMap.delete(scenarioId);
      }
    });
  }

  /**
   * 清理所有可视化
   * Clear all visualization
   */
  clearAllVisualization() {
    Object.values(this.comparisonVisualization).forEach(visualMap => {
      if (visualMap instanceof Map) {
        visualMap.clear();
      }
    });
  }

  /**
   * 初始化分析工具
   * Initialize analysis tools
   */
  initializeAnalysisTools() {
    // 这里可以初始化更高级的分析工具
    this.analysisTools.statisticalAnalysis = {
      tTest: this.performTTest.bind(this),
      anova: this.performANOVA.bind(this),
      regression: this.performRegression.bind(this)
    };
  }

  /**
   * 执行t检验
   * Perform t-test
   * @param {Array<number>} sample1 - 样本1
   * @param {Array<number>} sample2 - 样本2
   * @returns {Object} t检验结果
   */
  performTTest(sample1, sample2) {
    // 简化的t检验实现
    const mean1 = sample1.reduce((sum, val) => sum + val, 0) / sample1.length;
    const mean2 = sample2.reduce((sum, val) => sum + val, 0) / sample2.length;
    
    const var1 = sample1.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0) / (sample1.length - 1);
    const var2 = sample2.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0) / (sample2.length - 1);
    
    const pooledVar = ((sample1.length - 1) * var1 + (sample2.length - 1) * var2) / (sample1.length + sample2.length - 2);
    const standardError = Math.sqrt(pooledVar * (1/sample1.length + 1/sample2.length));
    
    const tStatistic = (mean1 - mean2) / standardError;
    const degreesOfFreedom = sample1.length + sample2.length - 2;
    
    return {
      tStatistic: tStatistic,
      degreesOfFreedom: degreesOfFreedom,
      pValue: this.calculatePValue(tStatistic, degreesOfFreedom),
      isSignificant: Math.abs(tStatistic) > 2.0 // 简化的显著性判断
    };
  }

  /**
   * 计算p值（简化版本）
   * Calculate p-value (simplified version)
   * @param {number} tStatistic - t统计量
   * @param {number} df - 自由度
   * @returns {number} p值
   */
  calculatePValue(tStatistic, df) {
    // 这是一个非常简化的p值计算，实际应用中需要更精确的实现
    const absT = Math.abs(tStatistic);
    if (absT > 3) return 0.01;
    if (absT > 2) return 0.05;
    if (absT > 1) return 0.1;
    return 0.2;
  }

  /**
   * 执行方差分析
   * Perform ANOVA
   * @param {Array<Array<number>>} groups - 分组数据
   * @returns {Object} ANOVA结果
   */
  performANOVA(groups) {
    // 简化的ANOVA实现
    const allValues = groups.flat();
    const grandMean = allValues.reduce((sum, val) => sum + val, 0) / allValues.length;
    
    // 计算组间平方和
    const betweenSS = groups.reduce((sum, group) => {
      const groupMean = group.reduce((s, v) => s + v, 0) / group.length;
      return sum + group.length * Math.pow(groupMean - grandMean, 2);
    }, 0);
    
    // 计算组内平方和
    const withinSS = groups.reduce((sum, group) => {
      const groupMean = group.reduce((s, v) => s + v, 0) / group.length;
      return sum + group.reduce((s, v) => s + Math.pow(v - groupMean, 2), 0);
    }, 0);
    
    const betweenDF = groups.length - 1;
    const withinDF = allValues.length - groups.length;
    
    const betweenMS = betweenSS / betweenDF;
    const withinMS = withinSS / withinDF;
    
    const fStatistic = betweenMS / withinMS;
    
    return {
      fStatistic: fStatistic,
      betweenDF: betweenDF,
      withinDF: withinDF,
      pValue: this.calculateFPValue(fStatistic, betweenDF, withinDF),
      isSignificant: fStatistic > 3.0 // 简化的显著性判断
    };
  }

  /**
   * 计算F分布p值（简化版本）
   * Calculate F-distribution p-value (simplified version)
   * @param {number} fStatistic - F统计量
   * @param {number} df1 - 分子自由度
   * @param {number} df2 - 分母自由度
   * @returns {number} p值
   */
  calculateFPValue(fStatistic, df1, df2) {
    // 简化的F分布p值计算
    if (fStatistic > 5) return 0.01;
    if (fStatistic > 3) return 0.05;
    if (fStatistic > 2) return 0.1;
    return 0.2;
  }

  /**
   * 执行回归分析
   * Perform regression analysis
   * @param {Array<number>} x - 自变量
   * @param {Array<number>} y - 因变量
   * @returns {Object} 回归分析结果
   */
  performRegression(x, y) {
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // 计算R²
    const yMean = sumY / n;
    const totalSS = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
    const residualSS = y.reduce((sum, val, i) => {
      const predicted = slope * x[i] + intercept;
      return sum + Math.pow(val - predicted, 2);
    }, 0);
    const rSquared = 1 - (residualSS / totalSS);
    
    return {
      slope: slope,
      intercept: intercept,
      rSquared: rSquared,
      correlation: Math.sqrt(rSquared) * (slope > 0 ? 1 : -1)
    };
  }

  /**
   * 获取比较结果
   * Get comparison result
   * @param {string} comparisonId - 比较ID
   * @returns {Object|null} 比较结果
   */
  getComparisonResult(comparisonId) {
    return this.activeComparisons.get(comparisonId) || null;
  }

  /**
   * 获取所有比较结果
   * Get all comparison results
   * @returns {Array<Object>} 所有比较结果
   */
  getAllComparisonResults() {
    return Array.from(this.activeComparisons.values());
  }

  /**
   * 销毁比较器
   * Destroy comparator
   */
  destroy() {
    // 清理所有数据
    this.clearAllComparisons();
    
    // 移除面板
    if (this.comparisonPanel && this.comparisonPanel.parentNode) {
      this.comparisonPanel.parentNode.removeChild(this.comparisonPanel);
    }
    
    // 清理分析工具
    this.analysisTools = null;
  }
}