// Update the TTI comparison chart to accurately reflect the table data
document.addEventListener('DOMContentLoaded', function() {
  // Create the chart container and canvas
  const createTTIChart = () => {
    const comparisonSection = document.querySelector('.comparison');
    if (!comparisonSection) return;
    
    // Create container for the chart
    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container';
    chartContainer.style.maxWidth = '800px';
    chartContainer.style.margin = '40px auto';
    chartContainer.style.height = '400px';
    
    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.id = 'ttiComparisonChart';
    chartContainer.appendChild(canvas);
    
    // Insert after the intro text
    const introElement = comparisonSection.querySelector('.comparison-intro');
    introElement.parentNode.insertBefore(chartContainer, introElement.nextSibling);
    
    // Draw the chart
    drawTTIChart();
  };
  
  // Draw the TTI chart based on the table data
  const drawTTIChart = () => {
    const canvas = document.getElementById('ttiComparisonChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    canvas.width = canvas.parentNode.offsetWidth;
    canvas.height = 400;
    
    // Chart data based on the actual table data
    const providers = ['Forward Email', 'Postmark'];
    
    // TTI data in seconds (min and max values)
    const ttiData = [
      { provider: 'Forward Email', min: 1.6, max: 1.7 },
      { provider: 'Postmark', min: 11.96, max: 23.23 }
    ];
    
    // Colors
    const colors = {
      forwardEmail: '#3498db',
      postmark: '#e74c3c',
      background: '#f8f9fa',
      text: '#333333',
      grid: '#dddddd'
    };
    
    // Chart dimensions
    const chartTop = 60;
    const chartBottom = canvas.height - 60;
    const chartLeft = 80;
    const chartRight = canvas.width - 80;
    const chartWidth = chartRight - chartLeft;
    const chartHeight = chartBottom - chartTop;
    
    // Calculate max value for scaling (with 20% padding)
    const maxValue = 28; // Slightly higher than the max TTI value
    
    // Draw title
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Time to Inbox (TTI) Comparison (seconds)', canvas.width / 2, 30);
    
    // Draw y-axis
    ctx.strokeStyle = colors.grid;
    ctx.beginPath();
    ctx.moveTo(chartLeft, chartTop);
    ctx.lineTo(chartLeft, chartBottom);
    ctx.stroke();
    
    // Draw y-axis labels and grid lines
    ctx.fillStyle = colors.text;
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    
    const yAxisSteps = 7; // 0, 5, 10, 15, 20, 25
    for (let i = 0; i <= yAxisSteps; i++) {
      const value = (maxValue / yAxisSteps) * i;
      const y = chartBottom - (chartHeight * (value / maxValue));
      
      // Draw label
      ctx.fillText(value.toFixed(0) + 's', chartLeft - 10, y + 4);
      
      // Draw grid line
      ctx.strokeStyle = colors.grid;
      ctx.beginPath();
      ctx.moveTo(chartLeft, y);
      ctx.lineTo(chartRight, y);
      ctx.stroke();
    }
    
    // Draw x-axis
    ctx.strokeStyle = colors.grid;
    ctx.beginPath();
    ctx.moveTo(chartLeft, chartBottom);
    ctx.lineTo(chartRight, chartBottom);
    ctx.stroke();
    
    // Bar width and spacing
    const barWidth = chartWidth / 5;
    const barSpacing = barWidth / 2;
    
    // Draw bars for TTI data
    ttiData.forEach((item, index) => {
      const x = chartLeft + (index * (barWidth + barSpacing)) + barSpacing;
      
      // Draw min value bar
      const minHeight = chartHeight * (item.min / maxValue);
      const minY = chartBottom - minHeight;
      
      ctx.fillStyle = item.provider === 'Forward Email' ? colors.forwardEmail : colors.postmark;
      ctx.fillRect(x, minY, barWidth, minHeight);
      
      // Draw max value as a line on top of the bar
      const maxHeight = chartHeight * (item.max / maxValue);
      const maxY = chartBottom - maxHeight;
      
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, maxY);
      ctx.lineTo(x + barWidth, maxY);
      ctx.stroke();
      
      // Draw range text
      ctx.fillStyle = colors.text;
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${item.min}s - ${item.max}s`, x + barWidth/2, minY - 10);
      
      // Draw provider name
      ctx.fillStyle = colors.text;
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.provider, x + barWidth/2, chartBottom + 20);
    });
    
    // Draw note about other providers
    ctx.fillStyle = colors.text;
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Note: SendGrid, Mailgun, and Amazon SES data shows inbox placement rates', canvas.width / 2, chartBottom + 50);
    ctx.fillText('(61.0%, 71.4%, and 77.1% respectively) rather than TTI metrics', canvas.width / 2, chartBottom + 70);
  };
  
  // Initialize the chart
  createTTIChart();
});
