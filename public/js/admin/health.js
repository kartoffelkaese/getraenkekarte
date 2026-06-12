/**
 * Admin: System-Health-Anzeige (Einstellungen-Tab).
 */
(function () {
    let autoRefreshInterval = null;
    let isAutoRefreshActive = false;

    function loadHealthStatus() {
        if (typeof currentLocation !== 'undefined' && currentLocation === 'settings') {
            refreshHealthStatus();
        }
    }

    async function refreshHealthStatus() {
        const container = document.getElementById('healthStatusContainer');
        if (!container) return;

        try {
            container.innerHTML = `
            <div class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Lade...</span>
                </div>
                <p class="mt-2" style="color: #e0e0e0;">Lade System Status...</p>
            </div>
        `;

            const response = await fetch('/api/health');
            const healthData = await response.json();

            if (response.ok) {
                displayHealthStatus(healthData);
            } else {
                displayHealthError(healthData);
            }
        } catch (error) {
            console.error('Health Status Fehler:', error);
            displayHealthError({ error: 'Verbindung zum Server fehlgeschlagen' });
        }
    }

    function displayHealthStatus(data) {
        const container = document.getElementById('healthStatusContainer');
        if (!container) return;

        const isHealthy = data.status === 'healthy';
        const statusColor = isHealthy ? 'success' : 'danger';
        const statusIcon = isHealthy ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill';
        const dbConnected = isHealthy && data.database !== 'disconnected';
        const dbStatus = dbConnected ? 'Verbunden' : 'Getrennt';
        const dbColor = dbConnected ? 'success' : 'danger';
        const uptime = data.uptime != null ? formatHealthUptime(data.uptime) : 'N/A';
        const memory = data.memory ? formatHealthMemory(data.memory) : 'N/A';

        container.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <div class="card border-${statusColor}">
                    <div class="card-body">
                        <h6 class="card-title text-white">
                            <i class="bi ${statusIcon} text-${statusColor}"></i>
                            System Status
                        </h6>
                        <p class="card-text">
                            <span class="badge bg-${statusColor}">${data.status.toUpperCase()}</span>
                        </p>
                        <small class="text-light">
                            Letzte Aktualisierung: ${new Date(data.timestamp).toLocaleString('de-DE')}
                        </small>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card border-${dbColor}">
                    <div class="card-body">
                        <h6 class="card-title text-white">
                            <i class="bi bi-database text-${dbColor}"></i>
                            Datenbank
                        </h6>
                        <p class="card-text">
                            <span class="badge bg-${dbColor}">${dbStatus}</span>
                        </p>
                        <small class="text-light">
                            ${data.connectionStats ? `Verbindungen: ${data.connectionStats.activeConnections}/${data.connectionStats.totalConnections}` : 'Stats nicht verfügbar'}
                        </small>
                    </div>
                </div>
            </div>
        </div>
        <div class="row mt-3">
            <div class="col-md-4">
                <div class="card"><div class="card-body text-center">
                    <h6 class="card-title text-white"><i class="bi bi-clock"></i> Laufzeit</h6>
                    <p class="card-text h5 text-white">${uptime}</p>
                </div></div>
            </div>
            <div class="col-md-4">
                <div class="card"><div class="card-body text-center">
                    <h6 class="card-title text-white"><i class="bi bi-memory"></i> Speicher</h6>
                    <p class="card-text h5 text-white">${memory}</p>
                </div></div>
            </div>
            <div class="col-md-4">
                <div class="card"><div class="card-body text-center">
                    <h6 class="card-title text-white"><i class="bi bi-activity"></i> Verbindungen</h6>
                    <p class="card-text h5 text-white">
                        ${data.connectionStats ? `${data.connectionStats.activeConnections}/${data.connectionStats.totalConnections}` : 'N/A'}
                    </p>
                </div></div>
            </div>
        </div>
    `;
    }

    function displayHealthError(data) {
        const container = document.getElementById('healthStatusContainer');
        if (!container) return;
        container.innerHTML = `
        <div class="alert alert-danger">
            <h6><i class="bi bi-exclamation-triangle-fill"></i> System Status Fehler</h6>
            <p class="mb-0">${escapeHtml(data.error || data.message || (data.status === 'unhealthy' ? 'Dienst nicht bereit (Datenbank / Health)' : 'Unbekannter Fehler'))}</p>
            <small class="text-light">Zeit: ${new Date().toLocaleString('de-DE')}</small>
        </div>
    `;
    }

    function formatHealthUptime(seconds) {
        if (seconds == null || Number.isNaN(Number(seconds))) return 'N/A';
        const s = Number(seconds);
        const days = Math.floor(s / 86400);
        const hours = Math.floor((s % 86400) / 3600);
        const minutes = Math.floor((s % 3600) / 60);
        if (days > 0) return `${days}d ${hours}h ${minutes}m`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    }

    function formatHealthMemory(memory) {
        const usedMB = Math.round(memory.heapUsed / 1024 / 1024);
        const totalMB = Math.round(memory.heapTotal / 1024 / 1024);
        return `${usedMB}MB / ${totalMB}MB`;
    }

    function toggleAutoRefresh() {
        const icon = document.getElementById('autoRefreshIcon');
        const text = document.getElementById('autoRefreshText');

        if (isAutoRefreshActive) {
            clearInterval(autoRefreshInterval);
            autoRefreshInterval = null;
            isAutoRefreshActive = false;
            icon.className = 'bi bi-play-circle';
            text.textContent = 'Auto-Refresh';
            showNotification('Auto-Refresh gestoppt', 'info');
        } else {
            autoRefreshInterval = setInterval(refreshHealthStatus, 10000);
            isAutoRefreshActive = true;
            icon.className = 'bi bi-pause-circle';
            text.textContent = 'Stoppen';
            showNotification('Auto-Refresh gestartet (10s)', 'success');
        }
    }

    window.refreshHealthStatus = refreshHealthStatus;
    window.toggleAutoRefresh = toggleAutoRefresh;
    window.loadHealthStatus = loadHealthStatus;
})();
