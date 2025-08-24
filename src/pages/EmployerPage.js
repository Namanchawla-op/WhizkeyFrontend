import React, { useState, useEffect } from 'react';
import '../styles/EmployerPage.css';

const EmployerPage = () => {
  const [currentDate] = useState(new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }));
  
  const [role, setRole] = useState('hr');
  const [filter, setFilter] = useState('all');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [aiMessages, setAiMessages] = useState([
    {
      sender: 'WhizBot',
      content: "Hello Jane! I'm your AI assistant for reviewing and approving requests. I'll provide policy-based recommendations for each request and can answer any questions you have about company guidelines."
    },
    {
      sender: 'WhizBot',
      content: "You currently have <strong>5 pending requests</strong> to review: <ul><li>2 HR requests (exemption & onboarding)</li><li>1 Finance request (expense report)</li><li>2 Logistics requests (travel & stationery)</li></ul>"
    }
  ]);
  const [aiInput, setAiInput] = useState('');
  
  const [onboardingRequests, setOnboardingRequests] = useState([
    {
      id: 1,
      employeeName: 'Mark Smith',
      department: 'Engineering',
      role: 'Software Developer',
      joiningDate: '2023-11-15',
      status: 'pending',
      type: 'hr',
      details: 'Requesting exemption for late arrival due to medical appointment. Doctor\'s note attached.'
    },
    {
      id: 2,
      employeeName: 'Taylor Johnson',
      department: 'Marketing',
      role: 'Content Specialist',
      joiningDate: '2023-11-20',
      status: 'review',
      type: 'hr',
      details: 'Submitted all onboarding documents except I-9 verification which requires in-person inspection.'
    },
    {
      id: 3,
      employeeName: 'Alex Smith',
      department: 'Finance',
      role: 'Financial Analyst',
      joiningDate: '2023-11-10',
      status: 'pending',
      type: 'finance',
      details: 'Client dinner at The Grill House - $187.50 (exceeds department meal limit by $37.50)'
    },
    {
      id: 4,
      employeeName: 'Riley Johnson',
      department: 'Operations',
      role: 'Project Manager',
      joiningDate: '2023-11-05',
      status: 'pending',
      type: 'logistics',
      details: 'Requesting flight and hotel for TechConf 2023 in Austin, TX from Nov 12-15. Preferred airline and 4-star hotel selected.'
    },
    {
      id: 5,
      employeeName: 'Casey White',
      department: 'HR',
      role: 'Recruiter',
      joiningDate: '2023-11-25',
      status: 'pending',
      type: 'logistics',
      details: 'Requesting 5 notebooks, 20 pens, and 10 highlighters for new team members starting next week.'
    }
  ]);

  const [newRequest, setNewRequest] = useState({
    employeeName: '',
    department: 'Engineering',
    role: '',
    joiningDate: ''
  });

  const departments = ['Engineering', 'Marketing', 'Finance', 'Operations', 'HR', 'Sales'];

  // Stats calculation
  const pendingCount = onboardingRequests.filter(req => req.status === 'pending').length;
  const completedCount = onboardingRequests.filter(req => req.status === 'approved').length;
  const delayedCount = onboardingRequests.filter(req => {
    const joiningDate = new Date(req.joiningDate);
    const today = new Date();
    return req.status !== 'approved' && joiningDate < today;
  }).length;

  const handleRequestAction = (id, action) => {
    setOnboardingRequests(prev => prev.map(req => {
      if (req.id === id) {
        return { ...req, status: action };
      }
      return req;
    }));
  };

  const handleNewRequestSubmit = (e) => {
    e.preventDefault();
    const newId = Math.max(...onboardingRequests.map(req => req.id)) + 1;
    setOnboardingRequests(prev => [
      ...prev,
      {
        id: newId,
        employeeName: newRequest.employeeName,
        department: newRequest.department,
        role: newRequest.role,
        joiningDate: newRequest.joiningDate,
        status: 'pending',
        type: 'hr',
        details: 'New onboarding request'
      }
    ]);
    setNewRequest({
      employeeName: '',
      department: 'Engineering',
      role: '',
      joiningDate: ''
    });
  };

  const handleAiSubmit = (e) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    // Add user message
    setAiMessages(prev => [
      ...prev,
      { sender: 'You', content: aiInput }
    ]);

    // Generate AI response (simplified for demo)
    setTimeout(() => {
      let response = "I can help with policy explanations, request prioritization, and approval recommendations. For detailed responses, this would connect to an AI service in production.";
      setAiMessages(prev => [
        ...prev,
        { sender: 'WhizBot', content: response }
      ]);
    }, 800);

    setAiInput('');
  };

  const filteredRequests = onboardingRequests.filter(req => {
    if (filter === 'all') return true;
    if (filter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      return req.joiningDate === today;
    }
    if (filter === 'delayed') {
      const joiningDate = new Date(req.joiningDate);
      const today = new Date();
      return req.status !== 'approved' && joiningDate < today;
    }
    return true;
  }).filter(req => {
    if (role === 'all') return true;
    return req.type === role;
  });

  return (
    <div className="employer-page">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">Whiz<span>Key</span></div>
          <button className="toggle-sidebar" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>≡</button>
        </div>
        
        <div className="role-selector">
          <div className="role-label">Current Role</div>
          <select 
            className="role-dropdown" 
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="hr">HR Supervisor</option>
            <option value="finance">Finance Supervisor</option>
            <option value="logistics">Logistics Supervisor</option>
          </select>
          <div className="role-icon">▼</div>
        </div>
        
        <div className="nav-menu">
          <div 
            className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`} 
            onClick={() => setActiveView('dashboard')}
          >
            <div className="nav-icon">📊</div>
            <div className="nav-text">Dashboard</div>
          </div>
          <div 
            className={`nav-item ${activeView === 'approvals' ? 'active' : ''}`} 
            onClick={() => setActiveView('approvals')}
          >
            <div className="nav-icon">✅</div>
            <div className="nav-text">Approvals</div>
          </div>
          <div 
            className={`nav-item ${activeView === 'reports' ? 'active' : ''}`} 
            onClick={() => setActiveView('reports')}
          >
            <div className="nav-icon">📈</div>
            <div className="nav-text">Reports</div>
          </div>
          <div 
            className={`nav-item ${activeView === 'team' ? 'active' : ''}`} 
            onClick={() => setActiveView('team')}
          >
            <div className="nav-icon">👥</div>
            <div className="nav-text">Team Management</div>
          </div>
          <div 
            className={`nav-item ${activeView === 'settings' ? 'active' : ''}`} 
            onClick={() => setActiveView('settings')}
          >
            <div className="nav-icon">⚙️</div>
            <div className="nav-text">Settings</div>
          </div>
        </div>
        
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">JD</div>
            <div className="user-details">
              <div className="user-name">Jane Doe</div>
              <div className="user-role">{role.charAt(0).toUpperCase() + role.slice(1)} Supervisor</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="main-content">
        <div className="top-bar">
          <div className="search-bar">
            <div className="search-icon">🔍</div>
            <input type="text" className="search-input" placeholder="Search requests, employees..." />
          </div>
          
          <div className="utility-icons">
            <div className="current-date">{currentDate}</div>
            <button className="icon-button">
              🔔
              <span className="notification-badge">3</span>
            </button>
            <button className="icon-button">✉️</button>
            <button className="icon-button" onClick={() => setShowAIPanel(!showAIPanel)}>🤖</button>
          </div>
        </div>
        
        <div className="dashboard-content">
          <div className="request-panel">
            <div className="panel-header">
              <div className="panel-title">Onboarding Requests</div>
              <div className="panel-actions">
                <button 
                  className={`filter-button ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  All
                </button>
                <button 
                  className={`filter-button ${filter === 'today' ? 'active' : ''}`}
                  onClick={() => setFilter('today')}
                >
                  Today
                </button>
                <button 
                  className={`filter-button ${filter === 'delayed' ? 'active' : ''}`}
                  onClick={() => setFilter('delayed')}
                >
                  Delayed
                </button>
                <button className="refresh-button">🔄</button>
              </div>
            </div>
            
            {/* Summary Panel */}
            <div className="summary-panel">
              <div className="summary-card">
                <div className="summary-title">Pending</div>
                <div className="summary-value">{pendingCount}</div>
              </div>
              <div className="summary-card">
                <div className="summary-title">Completed</div>
                <div className="summary-value">{completedCount}</div>
              </div>
              <div className="summary-card">
                <div className="summary-title">Delayed</div>
                <div className="summary-value">{delayedCount}</div>
              </div>
            </div>
            
            {/* Add New Request Form */}
            <form className="new-request-form" onSubmit={handleNewRequestSubmit}>
              <h3>Add New Onboarding Request</h3>
              <div className="form-group">
                <label>Employee Name</label>
                <input 
                  type="text" 
                  value={newRequest.employeeName}
                  onChange={(e) => setNewRequest({...newRequest, employeeName: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Department</label>
                <select 
                  value={newRequest.department}
                  onChange={(e) => setNewRequest({...newRequest, department: e.target.value})}
                  required
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Role</label>
                <input 
                  type="text" 
                  value={newRequest.role}
                  onChange={(e) => setNewRequest({...newRequest, role: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Joining Date</label>
                <input 
                  type="date" 
                  value={newRequest.joiningDate}
                  onChange={(e) => setNewRequest({...newRequest, joiningDate: e.target.value})}
                  required
                />
              </div>
              <button type="submit" className="submit-button">Add Request</button>
            </form>
            
            {/* Requests Table */}
            <div className="requests-table">
              <div className="table-header">
                <div>Employee</div>
                <div>Department</div>
                <div>Role</div>
                <div>Joining Date</div>
                <div>Status</div>
                <div>Actions</div>
              </div>
              {filteredRequests.length > 0 ? (
                filteredRequests.map(request => (
                  <div key={request.id} className={`table-row ${request.status}`}>
                    <div>{request.employeeName}</div>
                    <div>{request.department}</div>
                    <div>{request.role}</div>
                    <div>{new Date(request.joiningDate).toLocaleDateString()}</div>
                    <div>
                      <span className={`status-badge ${request.status}`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                    <div className="action-buttons">
                      {request.status !== 'approved' && (
                        <button 
                          className="approve-button"
                          onClick={() => handleRequestAction(request.id, 'approved')}
                        >
                          Approve
                        </button>
                      )}
                      {request.status !== 'rejected' && (
                        <button 
                          className="reject-button"
                          onClick={() => handleRequestAction(request.id, 'rejected')}
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-requests">No onboarding requests match your filters</div>
              )}
            </div>
          </div>
          
          {/* AI Assistant Panel */}
          {showAIPanel && (
            <div className="ai-panel">
              <div className="ai-panel-header">
                <div className="ai-panel-title">
                  <div className="ai-avatar">🤖</div>
                  <span>WhizBot Assistant</span>
                </div>
                <button 
                  className="toggle-ai-panel"
                  onClick={() => setShowAIPanel(false)}
                >
                  ×
                </button>
              </div>
              
              <div className="ai-conversation">
                {aiMessages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`ai-message ${message.sender === 'You' ? 'user-message' : ''}`}
                  >
                    <div className="ai-message-header">
                      {message.sender !== 'You' && <span>🤖</span>}
                      <span>{message.sender}</span>
                    </div>
                    <div 
                      className="ai-message-content"
                      dangerouslySetInnerHTML={{ __html: message.content }}
                    />
                  </div>
                ))}
              </div>
              
              <form className="ai-input-area" onSubmit={handleAiSubmit}>
                <input 
                  type="text" 
                  className="ai-input" 
                  placeholder="Ask WhizBot about policies or requests..."
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                />
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployerPage;