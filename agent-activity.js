const AgentActivity = {
    activityStream: [],
    maxStreamSize: 20,

    init: function() {
        console.log('Agent Activity System Initialized');
        // Load existing activity from localStorage or a remote source if available
        this.loadActivityStream();
        this.updateActivityList();
        this.renderPanel();
    },

    renderPanel: function() {
        if (typeof document === 'undefined') {
            return;
        }

        const panel = document.querySelector('#agent-activity-panel');
        if (!panel) {
            return;
        }

        let header = panel.querySelector('h3');
        if (!header) {
            header = document.createElement('h3');
            panel.appendChild(header);
        }
        header.textContent = 'Recent Activity';

        let list = panel.querySelector('#activity-list');
        if (!list) {
            list = document.createElement('ul');
            list.id = 'activity-list';
            panel.appendChild(list);
        }
    },

    updateActivityList: function() {
        if (typeof document === 'undefined') {
            return;
        }

        this.renderPanel();

        const list = document.getElementById('activity-list');
        if (!list) {
            return;
        }

        list.innerHTML = '';

        this.activityStream.forEach((activity) => {
            const listItem = document.createElement('li');
            const agentName = activity.agentName || activity.agent || 'Unknown Agent';
            listItem.textContent = `${activity.timestamp} - ${agentName}: ${activity.action}`;
            list.appendChild(listItem);
        });
    },

    logActivity: function(agentName, action, details) {
        const timestamp = new Date().toISOString();
        const activity = {
            timestamp,
            agentName,
            action,
            details
        };

        this.activityStream.unshift(activity);

        if (this.activityStream.length > this.maxStreamSize) {
            this.activityStream.pop();
        }

        this.saveActivityStream();
        this.broadcastActivity(activity);
    },

    loadActivityStream: function() {
        try {
            const savedStream = localStorage.getItem('agentActivityStream');
            if (savedStream) {
                this.activityStream = JSON.parse(savedStream);
            }
        } catch (e) {
            console.error('Failed to load agent activity stream:', e);
        }
    },

    saveActivityStream: function() {
        try {
            localStorage.setItem('agentActivityStream', JSON.stringify(this.activityStream));
        } catch (e) {
            console.error('Failed to save agent activity stream:', e);
        }
        this.updateActivityList();
    },

    broadcastActivity: function(activity) {
        const eventDetail = { detail: { activity } };
        if (typeof document !== 'undefined') {
            document.dispatchEvent(new CustomEvent('agentActivity', eventDetail));
        }
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('agentActivity', eventDetail));
        }
    },

    getActivityStream: function() {
        return this.activityStream;
    }
};

if (typeof window !== 'undefined') {
    window.AgentActivity = AgentActivity;
    AgentActivity.init();
    window.AgentActivity.logActivity('System', 'Initialized', 'Activity feed is online.');
}

export { AgentActivity };
