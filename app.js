// Utility functions
const Utils = {
    formatDate(date) {
        return new Date(date).toLocaleDateString();
    },
    
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    },
    
    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
    
    showError(message) {
        alert(message); // In production, replace with proper error handling UI
    }
};

// Data management class
class DataStore {
    constructor() {
        this.mockData = {
            users: {
                parents: [
                    { id: 1, email: 'parent@example.com', password: 'parent123', childId: 1 }
                ],
                children: [
                    { 
                        id: 1, 
                        name: 'Joy Ron', 
                        age: 8,
                        surgeryType: 'Appendectomy',
                        surgeryDate: '2025-02-01',
                        status: 'Recovery',
                        symptoms: [],
                        medications: [
                            { name: 'Painkiller', schedule: 'Every 6 hours', dosage: '5ml' }
                        ]
                    }
                ],
                surgeons: [
                    { 
                        id: 1, 
                        hospitalId: 'SURG001', 
                        password: 'surgeon123',
                        name: 'Dr. Smith',
                        patients: [1]
                    }
                ]
            },
            symptoms: [],
            appointments: []
        };
    }

    authenticate(role, identifier, password) {
        let users;
        switch(role) {
            case 'parent':
                users = this.mockData.users.parents;
                return users.find(u => u.email === identifier && u.password === password);
            case 'surgeon':
                users = this.mockData.users.surgeons;
                return users.find(u => u.hospitalId === identifier && u.password === password);
            case 'child':
                users = this.mockData.users.children;
                return users.find(u => u.id.toString() === identifier && password === 'child123');
            default:
                return null;
        }
    }

    getChildData(childId) {
        return this.mockData.users.children.find(c => c.id === childId);
    }

    getSurgeonPatients(surgeonId) {
        const surgeon = this.mockData.users.surgeons.find(s => s.id === surgeonId);
        return surgeon.patients.map(patientId => 
            this.mockData.users.children.find(c => c.id === patientId)
        );
    }

    addSymptomLog(childId, log) {
        const child = this.getChildData(childId);
        if (child) {
            child.symptoms.push({
                ...log,
                id: Utils.generateId(),
                timestamp: new Date().toISOString()
            });
            return true;
        }
        return false;
    }
}

// Main application class
class PostSurgeryApp {
    constructor() {
        this.currentUser = null;
        this.currentRole = null;
        this.dataStore = new DataStore();
        this.initializeApp();
    }

    initializeApp() {
        this.attachEventListeners();
        this.setupFormValidation();
        this.initializeDashboards();
    }

    attachEventListeners() {
        // Role selection
        document.querySelectorAll('.role-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleRoleSelection(e));
        });

        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Logout buttons
        document.querySelectorAll('.logout-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleLogout());
        });

        // Symptom form
        const symptomForm = document.getElementById('symptom-form');
        if (symptomForm) {
            symptomForm.addEventListener('submit', (e) => this.handleSymptomLog(e));
        }

        // Navigation
        document.querySelectorAll('.nav-items a').forEach(link => {
            link.addEventListener('click', (e) => this.handleNavigation(e));
        });
    }

    setupFormValidation() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            const inputs = loginForm.querySelectorAll('input');
            inputs.forEach(input => {
                input.addEventListener('input', () => this.validateInput(input));
            });
        }
    }

    validateInput(input) {
        const isValid = input.checkValidity();
        input.classList.toggle('invalid', !isValid);
        return isValid;
    }

    handleRoleSelection(e) {
        const role = e.target.dataset.role;
        this.currentRole = role;
        
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.classList.remove('hidden');
            this.updateLoginUI(role);
        }
    }

    updateLoginUI(role) {
        const usernameLabel = document.querySelector('label[for="username"]');
        if (usernameLabel) {
            switch(role) {
                case 'surgeon':
                    usernameLabel.textContent = 'Hospital ID';
                    break;
                case 'parent':
                    usernameLabel.textContent = 'Email';
                    break;
                case 'child':
                    usernameLabel.textContent = 'User ID';
                    break;
            }
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const user = this.dataStore.authenticate(this.currentRole, username, password);
            if (user) {
                this.currentUser = user;
                this.showDashboard(this.currentRole);
            } else {
                Utils.showError('Invalid credentials');
            }
        } catch (error) {
            Utils.showError('Login failed');
            console.error('Login error:', error);
        }
    }

    handleLogout() {
        this.currentUser = null;
        this.currentRole = null;
        this.showSection('login-section');
        document.getElementById('login-form').reset();
    }

    showDashboard(role) {
        // Hide all sections
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.classList.add('hidden');
        });

        // Show appropriate dashboard
        const dashboardId = `${role}-dashboard`;
        const dashboard = document.getElementById(dashboardId);
        if (dashboard) {
            dashboard.classList.remove('hidden');
            this.updateDashboardData(role);
        }
    }

    updateDashboardData(role) {
        switch(role) {
            case 'parent':
                this.updateParentDashboard();
                break;
            case 'child':
                this.updateChildDashboard();
                break;
            case 'surgeon':
                this.updateSurgeonDashboard();
                break;
        }
    }

    updateParentDashboard() {
        if (!this.currentUser) return;

        const childData = this.dataStore.getChildData(this.currentUser.childId);
        if (childData) {
            document.getElementById('child-name').textContent = childData.name;
            document.getElementById('child-age').textContent = childData.age;
            document.getElementById('surgery-type').textContent = childData.surgeryType;
            document.getElementById('surgery-date').textContent = Utils.formatDate(childData.surgeryDate);
        }
    }

    updateChildDashboard() {
        if (!this.currentUser) return;

        const childName = document.getElementById('child-dashboard-name');
        if (childName) {
            childName.textContent = this.currentUser.name;
        }

        this.updateProgressPath();
        this.updateDailyTasks();
    }
//code i added
loadHealingStories() {
        const stories = [
            { title: "Day 1: Beginning My Journey", content: "Today I had my surgery..." },
            { title: "Day 2: Small Steps Forward", content: "I walked a little today..." }
        ];

        const storyCarousel = document.querySelector('.story-carousel');
        if (storyCarousel) {
            storyCarousel.innerHTML = stories.map(story => `
                <div class="story-card">
                    <h3>${story.title}</h3>
                    <p>${story.content}</p>
                </div>
            `).join('');
        }
    }

    loadDailyMissions() {
        const missions = [
            { task: "Take all medications", completed: false },
            { task: "Walk for 5 minutes", completed: false },
            { task: "Do breathing exercises", completed: false }
        ];

        const missionsList = document.querySelector('.missions-list');
        if (missionsList) {
            missionsList.innerHTML = missions.map(mission => `
                <div class="mission-card">
                    <input type="checkbox" ${mission.completed ? 'checked' : ''}>
                    <span>${mission.task}</span>
                </div>
            `).join('');
        }
    }

    initializeGame() {
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            // Basic game initialization
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        }
    }
//end of code I added










    updateSurgeonDashboard() {
        if (!this.currentUser) return;

        const patients = this.dataStore.getSurgeonPatients(this.currentUser.id);
        this.renderPatientList(patients);
    }

    renderPatientList(patients) {
        const patientList = document.querySelector('.patient-list');
        if (!patientList) return;

        patientList.innerHTML = patients.map(patient => `
            <div class="patient-card">
                <h3>${patient.name}</h3>
                <p>Age: ${patient.age}</p>
                <p>Surgery: ${patient.surgeryType}</p>
                <p>Status: ${patient.status}</p>
                <button onclick="app.viewPatientDetails(${patient.id})" class="primary-btn">
                    View Details
                </button>
            </div>
        `).join('');
    }

    async handleSymptomLog(e) {
        e.preventDefault();
        
        const painLevel = document.querySelector('.pain-slider').value;
        const temperature = document.querySelector('.temp-input').value;
        const notes = document.querySelector('.symptom-notes').value;

        const log = {
            painLevel: parseInt(painLevel),
            temperature: parseFloat(temperature),
            notes: notes
        };

        if (this.dataStore.addSymptomLog(this.currentUser.childId, log)) {
            Utils.showError('Symptom log saved successfully');
            e.target.reset();
        } else {
            Utils.showError('Failed to save symptom log');
        }
    }

    handleNavigation(e) {
        e.preventDefault();
        
        const targetId = e.target.getAttribute('href').slice(1);
        this.showPanel(targetId);
    }

    showPanel(panelId) {
        document.querySelectorAll('.dashboard-panel').forEach(panel => {
            panel.classList.add('hidden');
        });

        const targetPanel = document.getElementById(panelId);
        if (targetPanel) {
            targetPanel.classList.remove('hidden');
        }
    }

    showSection(sectionId) {
        document.querySelectorAll('section').forEach(section => {
            section.classList.add('hidden');
        });

        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }
    }
}





































// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PostSurgeryApp();
});