// Heavy data processing in background thread
self.onmessage = function(e) {
    const { type, data } = e.data;
    
    switch(type) {
        case 'PROCESS_DASHBOARD_DATA':
            const result = processDashboardData(data);
            self.postMessage({ type: 'DASHBOARD_PROCESSED', result });
            break;
            
        case 'CALCULATE_STATS':
            const stats = calculateComplexStats(data);
            self.postMessage({ type: 'STATS_CALCULATED', stats });
            break;
            
        case 'FILTER_LARGE_DATASET':
            const filtered = filterLargeDataset(data.items, data.filters);
            self.postMessage({ type: 'DATASET_FILTERED', filtered });
            break;
    }
};

function processDashboardData(data) {
    const { rooms, bills, reservations } = data;
    
    const occupancyRate = Math.round((rooms.filter(r => r.status === 'Occupée').length / rooms.length) * 100);
    const todayRevenue = bills
        .filter(b => b.date === new Date().toISOString().split('T')[0])
        .reduce((sum, b) => sum + parseInt(b.amount || 0), 0);
    
    return { occupancyRate, todayRevenue };
}

function calculateComplexStats(bills) {
    const stats = {};
    bills.forEach(bill => {
        const date = new Date(bill.date);
        const month = `${date.getFullYear()}-${date.getMonth()}`;
        
        if (!stats[month]) stats[month] = { total: 0, count: 0 };
        stats[month].total += parseInt(bill.amount || 0);
        stats[month].count++;
    });
    
    return stats;
}

function filterLargeDataset(items, filters) {
    return items.filter(item => {
        return filters.every(filter => {
            const value = item[filter.field];
            switch(filter.operator) {
                case 'contains': return value?.toLowerCase().includes(filter.value.toLowerCase());
                case 'equals': return value === filter.value;
                case 'gt': return parseFloat(value) > parseFloat(filter.value);
                default: return true;
            }
        });
    });
}