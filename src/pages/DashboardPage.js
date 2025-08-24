import React, { useState, useEffect } from 'react';
import '../styles/DashboardPage.css';

// Sub-components
const Header = ({ currentDate, toggleAIPanel }) => (
  <header className="top-bar">
    <div className="search-bar">
      <div className="search-icon">🔍</div>
      <input type="text" className="search-input" placeholder="Search requests, employees..." />
    </div>
    
    <div className="utility-icons">
      <button className="icon-button">
        🔔
        <span className="notification-badge">3</span>
      </button>
      <button className="icon-button">✉️</button>
      <button className="icon-button" onClick={toggleAIPanel}>🤖</button>
    </div>
  </header>
);

const Sidebar = ({ 
  collapsed, 
  toggleSidebar, 
  currentRole, 
  setCurrentRole,
  activeView,
  setActiveView
}) => (
  <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
    <div className="sidebar-header">
      <div className="logo">Whiz<span>Key</span></div>
      <button className="toggle-sidebar" onClick={toggleSidebar}>≡</button>
    </div>
    
    <div className="role-selector">
      <div className="role-label">Current Role</div>
      <select 
        className="role-dropdown" 
        value={currentRole}
        onChange={(e) => setCurrentRole(e.target.value)}
      >
        <option value="hr">HR Supervisor</option>
        <option value="finance">Finance Supervisor</option>
        <option value="logistics">Logistics Supervisor</option>
      </select>
      <div className="role-icon">▼</div>
    </div>
    
    <div className="nav-menu">
      {['dashboard', 'approvals', 'reports', 'team', 'settings'].map((view) => (
        <div 
          key={view}
          className={`nav-item ${activeView === view ? 'active' : ''}`}
          onClick={() => setActiveView(view)}
        >
          <div className="nav-icon">
            {view === 'dashboard' && '📊'}
            {view === 'approvals' && '✅'}
            {view === 'reports' && '📈'}
            {view === 'team' && '👥'}
            {view === 'settings' && '⚙️'}
          </div>
          <div className="nav-text">
            {view.charAt(0).toUpperCase() + view.slice(1)}
            {view === 'team' && ' Management'}
          </div>
        </div>
      ))}
    </div>
    
    <div className="sidebar-footer">
      <div className="user-info">
        <div className="user-avatar">JD</div>
        <div className="user-details">
          <div className="user-name">Jane Doe</div>
          <div className="user-role">
            {currentRole === 'hr' && 'HR Supervisor'}
            {currentRole === 'finance' && 'Finance Supervisor'}
            {currentRole === 'logistics' && 'Logistics Supervisor'}
          </div>
        </div>
      </div>
    </div>
  </aside>
);

const RequestCard = ({ 
  request, 
  onApprove, 
  onReject, 
  onReview 
}) => (
  <div className={`request-card ${request.department}-card`}>
    <div className="request-header">
      <div className="request-title">{request.type}</div>
      <div className={`request-status status-${request.status}`}>
        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
      </div>
    </div>
    <div className="request-meta">
      <div className="request-employee">
        <div className="employee-avatar">
          {request.employee.split(' ').map(n => n[0]).join('')}
        </div>
        <div className="employee-name">{request.employee}</div>
      </div>
      <div className="request-date">
        <span>📅</span>
        <span>{request.date}</span>
      </div>
    </div>
    <div className="request-details">
      {request.details}
    </div>
    {request.status === 'pending' && (
      <>
        <div className="request-actions">
          <button 
            className="action-button approve-button"
            onClick={() => onApprove(request.id)}
          >
            Approve
          </button>
          <button 
            className="action-button reject-button"
            onClick={() => onReject(request.id)}
          >
            Reject
          </button>
          <button 
            className="action-button review-button"
            onClick={() => onReview(request.id)}
          >
            Review
          </button>
        </div>
        <div className="ai-suggestion">
          <div className="ai-suggestion-header">
            <span>🤖</span>
            <span>Policy Assistant</span>
          </div>
          <div className="ai-suggestion-text">
            {request.aiSuggestion}
          </div>
          <div className="feedback-buttons">
            <button className="feedback-button">👍 Useful</button>
            <button className="feedback-button">👎 Not Useful</button>
          </div>
        </div>
      </>
    )}
  </div>
);

const AIPanel = ({ 
  collapsed, 
  togglePanel,
  currentRole,
  pendingCounts,
  addAIMessage
}) => {
  const [inputMessage, setInputMessage] = useState('');
  
  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      // Add user message
      addAIMessage(inputMessage, true);
      
      // Generate AI response
      setTimeout(() => {
        const response = generateAIResponse(inputMessage, currentRole, pendingCounts);
        addAIMessage(response);
      }, 800);
      
      setInputMessage('');
    }
  };

  return (
    <div className={`ai-panel ${collapsed ? 'collapsed' : ''}`}>
      <div className="ai-panel-header">
        <div className="ai-panel-title">
          <div className="ai-avatar">🤖</div>
          <span>WhizBot Assistant</span>
        </div>
        <button className="toggle-ai-panel" onClick={togglePanel}>×</button>
      </div>
      
      <div className="ai-conversation">
        <div className="ai-message">
          <div className="ai-message-header">
            <span>🤖</span>
            <span>WhizBot</span>
          </div>
          <div className="ai-message-content">
            Hello Jane! I'm your AI assistant for reviewing and approving requests. 
            I'll provide policy-based recommendations for each request and can answer 
            any questions you have about company guidelines.
          </div>
        </div>
      </div>
      
      <div className="ai-input-area">
        <input 
          type="text" 
          className="ai-input" 
          placeholder="Ask WhizBot about policies or requests..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
      </div>
    </div>
  );
};

// Main Dashboard Component
const DashboardPage = () => {
  // State management
  const [currentDate, setCurrentDate] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentRole, setCurrentRole] = useState('hr');
  const [activeView, setActiveView] = useState('dashboard');
  const [aiPanelCollapsed, setAIPanelCollapsed] = useState(true);
  const [requests, setRequests] = useState([]);
  const [conversation, setConversation] = useState([]);
  
  // Initialize with mock data
  useEffect(() => {
    // Set current date
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDate(now.toLocaleDateString('en-US', options));
    
    // Load mock requests
    const mockRequests = [
      {
        id: 1,
        type: 'Attendance Exemption',
        department: 'hr',
        employee: 'Mark Smith',
        details: 'Requesting exemption for late arrival due to medical appointment. Doctor\'s note attached.',
        status: 'pending',
        date: 'Today, 10:45 AM',
        aiSuggestion: 'According to HR policy #4.2, medical exemptions with documentation should be approved unless exceeding 3 instances per quarter (this is employee\'s 1st this quarter).'
      },
      {
        id: 2,
        type: 'Onboarding Documents',
        department: 'hr',
        employee: 'Taylor Johnson',
        details: 'Submitted all onboarding documents except I-9 verification which requires in-person inspection.',
        status: 'review',
        date: 'Yesterday, 3:30 PM',
        aiSuggestion: 'Policy allows provisional approval for 3 days pending I-9 verification. Schedule inspection with front desk.'
      },
      {
        id: 3,
        type: 'Expense Report',
        department: 'finance',
        employee: 'Alex Smith',
        details: 'Client dinner at The Grill House - $187.50 (exceeds department meal limit by $37.50)',
        status: 'pending',
        date: 'Today, 9:15 AM',
        aiSuggestion: 'While over limit, this client is Tier-1 and exception is justified with VP approval. Suggest approving with note to use more cost-effective options next time.'
      },
      {
        id: 4,
        type: 'Travel Request',
        department: 'logistics',
        employee: 'Riley Johnson',
        details: 'Requesting flight and hotel for TechConf 2023 in Austin, TX from Nov 12-15. Preferred airline and 4-star hotel selected.',
        status: 'pending',
        date: 'Yesterday, 5:20 PM',
        aiSuggestion: 'Hotel exceeds policy by $45/night, but conference rate is justified. Flight is within policy. Recommend approving with note to book through corporate travel portal.'
      },
      {
        id: 5,
        type: 'Stationery Order',
        department: 'logistics',
        employee: 'Casey White',
        details: 'Requesting 5 notebooks, 20 pens, and 10 highlighters for new team members starting next week.',
        status: 'pending',
        date: 'Today, 11:30 AM',
        aiSuggestion: 'Quantity is within quarterly allocation for team size. Suggest approving but reminding employee to check supply closet before future orders.'
      }
    ];
    
    setRequests(mockRequests);
  }, []);
  
  // Filter requests by current role and view
  const filteredRequests = requests.filter(request => 
    (currentRole === 'all' || request.department === currentRole) &&
    (activeView === 'dashboard' || activeView === 'approvals')
  );
  
  // Calculate pending counts by department
  const pendingCounts = requests.reduce((acc, request) => {
    if (request.status === 'pending') {
      acc[request.department] = (acc[request.department] || 0) + 1;
    }
    return acc;
  }, {});
  
  // Action handlers
  const handleApprove = (id) => {
    setRequests(requests.map(req => 
      req.id === id ? { ...req, status: 'approved' } : req
    ));
    addAIMessage(`Approved request #${id}. Would you like to add any notes?`);
  };
  
  const handleReject = (id) => {
    setRequests(requests.map(req => 
      req.id === id ? { ...req, status: 'rejected' } : req
    ));
    addAIMessage(`Rejected request #${id}. Would you like to document the reason?`);
  };
  
  const handleReview = (id) => {
    setRequests(requests.map(req => 
      req.id === id ? { ...req, status: 'review' } : req
    ));
    addAIMessage(`Marked request #${id} for review. What additional information do you need?`);
  };
  
  const addAIMessage = (content, isUser = false) => {
    const newMessage = {
      id: Date.now(),
      content,
      isUser,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setConversation(prev => [...prev, newMessage]);
  };
  
  // Toggle functions
  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const toggleAIPanel = () => setAIPanelCollapsed(!aiPanelCollapsed);
  
  return (
    <div className="dashboard-container">
      <Sidebar 
        collapsed={sidebarCollapsed}
        toggleSidebar={toggleSidebar}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        activeView={activeView}
        setActiveView={setActiveView}
      />
      
      <div className="main-content">
        <Header 
          currentDate={currentDate} 
          toggleAIPanel={toggleAIPanel}
        />
        
        <div className="dashboard-content">
          <div className="request-panel">
            <div className="panel-header">
              <div className="panel-title">
                {currentRole === 'all' ? 'All' : currentRole.charAt(0).toUpperCase() + currentRole.slice(1)} Requests
              </div>
              <div className="panel-actions">
                <button className="filter-button active">All</button>
                <button className="filter-button">Today</button>
                <button className="filter-button">High Priority</button>
                <button className="refresh-button">🔄</button>
              </div>
            </div>
            
            <div className="request-grid">
              {filteredRequests.length > 0 ? (
                filteredRequests.map(request => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onReview={handleReview}
                  />
                ))
              ) : (
                <div className="empty-state">No requests found</div>
              )}
            </div>
          </div>
          
          <AIPanel 
            collapsed={aiPanelCollapsed}
            togglePanel={toggleAIPanel}
            currentRole={currentRole}
            pendingCounts={pendingCounts}
            addAIMessage={addAIMessage}
          />
        </div>
      </div>
    </div>
  );
};

// Helper function to generate AI responses
const generateAIResponse = (question, currentRole, pendingCounts) => {
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('policy') || lowerQuestion.includes('rule')) {
    if (lowerQuestion.includes('medical') || lowerQuestion.includes('exemption')) {
      return "Medical exemption policy (HR-4.2): Employees may request exemptions for medical reasons with documentation. Allowances are:<br><br>" +
             "• Up to 3 instances per quarter<br>" +
             "• Maximum 4 hours per instance<br>" +
             "• Requires doctor's note for >2 hours<br><br>" +
             "Mark Smith's request is his 1st this quarter and has documentation.";
    } else if (lowerQuestion.includes('expense') || lowerQuestion.includes('meal')) {
      return "Expense policy (FIN-3.1):<br><br>" +
             "• Client meals: $150 max per person<br>" +
             "• Travel meals: $75 max per day<br>" +
             "• Alcohol not reimbursable<br><br>" +
             "Exceptions allowed for Tier-1 clients with VP approval.";
    } else if (lowerQuestion.includes('travel') || lowerQuestion.includes('hotel')) {
      return "Travel policy (LOG-2.3):<br><br>" +
             "• Flights: Economy class only<br>" +
             "• Hotels: 3-star max ($200/night)<br>" +
             "• Conference rates may exceed with justification<br><br>" +
             "Riley's hotel is $245/night but conference rate is standard.";
    } else {
      return "I can explain any company policy. Please specify which policy you're interested in (HR, Finance, or Logistics).";
    }
  } 
  else if (lowerQuestion.includes('priority') || lowerQuestion.includes('urgent')) {
    return "Based on deadlines and policy factors, I recommend this priority order:<br><br>" +
           "1. Onboarding documents (time-sensitive for new hire)<br>" +
           "2. Medical exemption (affects payroll processing)<br>" +
           "3. Travel request (booking deadlines approaching)<br>" +
           "4. Expense report (can wait 1-2 days)<br>" +
           "5. Stationery order (non-urgent)";
  }
  else if (lowerQuestion.includes('pending') || lowerQuestion.includes('count')) {
    const counts = [];
    if (pendingCounts.hr) counts.push(`${pendingCounts.hr} HR requests`);
    if (pendingCounts.finance) counts.push(`${pendingCounts.finance} Finance requests`);
    if (pendingCounts.logistics) counts.push(`${pendingCounts.logistics} Logistics requests`);
    
    return `You currently have ${counts.join(', ')} pending approval. Would you like me to prioritize them?`;
  }
  else {
    return "I can help with:<br><br>" +
           "• Explaining company policies<br>" +
           "• Prioritizing requests<br>" +
           "• Providing approval recommendations<br>" +
           "• Showing trends and analytics<br><br>" +
           "Try asking about a specific policy or request.";
  }
};

export default DashboardPage;