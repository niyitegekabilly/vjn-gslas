
import React from 'react';
import { 
  LayoutDashboard, Users, BookOpen, Banknote, CalendarCheck, Settings, 
  PieChart, ShieldAlert, Building, Sprout, PiggyBank, Gavel, 
  Receipt, ClipboardCheck, HelpCircle, Bell, UserCog
} from 'lucide-react';

export const MENU_ITEMS = [
  { id: 'dashboard', label: { en: 'Dashboard', rw: 'Incamake' }, icon: <LayoutDashboard size={20} />, path: '/' },
  { id: 'groups', label: { en: 'Groups', rw: 'Amatsinda' }, icon: <Building size={20} />, path: '/groups' },
  { id: 'members', label: { en: 'Members', rw: 'Abanyamuryango' }, icon: <Users size={20} />, path: '/members' },
  { id: 'seasons', label: { en: 'Seasons / Cycles', rw: 'Igihembwe' }, icon: <Sprout size={20} />, path: '/seasons' },
  { id: 'contributions', label: { en: 'Contributions (Savings)', rw: 'Ubwizigame' }, icon: <PiggyBank size={20} />, path: '/contributions' },
  { id: 'loans', label: { en: 'Loans', rw: 'Inguzanyo' }, icon: <Banknote size={20} />, path: '/loans' },
  { id: 'fines', label: { en: 'Fines', rw: 'Amande' }, icon: <Gavel size={20} />, path: '/fines' },
  { id: 'expenses', label: { en: 'Expenses', rw: 'Amafaranga yasohotse' }, icon: <Receipt size={20} />, path: '/expenses' },
  { id: 'attendance', label: { en: 'Attendance', rw: 'Ubwitabire' }, icon: <ClipboardCheck size={20} />, path: '/attendance' },
  { id: 'reports', label: { en: 'Reports', rw: 'Raporo' }, icon: <PieChart size={20} />, path: '/reports' },
  { id: 'notifications', label: { en: 'Notifications', rw: 'Amatangazo' }, icon: <Bell size={20} />, path: '/notifications' },
  { id: 'users', label: { en: 'Users & Roles', rw: 'Abakoresha' }, icon: <UserCog size={20} />, path: '/users' },
  { id: 'settings', label: { en: 'Settings', rw: 'Igenamiterere' }, icon: <Settings size={20} />, path: '/settings' },
  { id: 'audit', label: { en: 'Audit Logs', rw: 'Ubugenzuzi' }, icon: <ShieldAlert size={20} />, path: '/audit' },
  { id: 'help', label: { en: 'Help / Support', rw: 'Ubufasha' }, icon: <HelpCircle size={20} />, path: '/help' },
  // Keeping Meeting Mode access via URL, but removing from main menu to fit the requested clean structure. 
  // It is still accessible via Dashboard quick actions or direct link.
];

export const LABELS = {
  en: {
    // General
    appName: "VJN GSLA Management System",
    welcome: "Welcome back",
    currency: "RWF",
    loading: "Loading...",
    noData: "No records found.",
    date: "Date",
    amount: "Amount",
    description: "Description",
    type: "Type",
    actions: "Actions",
    status: "Status",
    search: "Search...",
    cancel: "Cancel",
    save: "Save",
    edit: "Edit",
    delete: "Delete",
    confirm: "Confirm",
    back: "Back",
    submit: "Submit",
    processing: "Processing...",
    void: "Void",
    history: "History",
    notes: "Notes",
    reason: "Reason",
    viewHistory: "View History",
    warning: "Warning",
    error: "Error",
    close: "Close",
    
    // Dashboard
    totalSavings: "Total Savings",
    loansActive: "Active Loans",
    members: "Members",
    cashBalance: "Cash Balance",
    overdue: "Overdue",
    lateLoans: "Late Loans",
    quickActions: "Quick Actions",
    financialTrends: "Financial Trends",
    healthIndicators: "Group Health Indicators",
    repaymentRate: "Repayment Rate",
    attendanceRate: "Attendance Rate",
    upcomingSchedule: "Upcoming Schedule",
    nextMeeting: "Next Meeting",
    loansDueSoon: "Loans Due Soon",
    assetAllocation: "Asset Allocation",
    activeSeasons: "Active Season",
    shareValue: "Share Value",
    sharesCollected: "Shares Collected",
    recordContribution: "Record Contribution",
    recordRepayment: "Record Repayment",
    recordNewFine: "Record New Fine",
    attendance: "Attendance",
    expenses: "Expenses",

    // Groups
    groupsManagement: "Groups Management",
    manageGroupsDesc: "Manage GSLA governance and settings",
    newGroup: "New Group",
    manageProfile: "Manage Profile",
    locationDetails: "Location Details",
    currentStatus: "Current Status",
    governanceStructure: "Governance Structure",
    financialConfiguration: "Financial Configuration",
    auditTrail: "Audit Trail",
    modifyGroup: "Modify Group",
    createGroupTitle: "Create New GSLA Group",
    identification: "Identification",
    financialRules: "Financial Rules",
    
    // Members
    addMember: "Add Member",
    editMember: "Edit Member",
    removeMember: "Remove Member",
    memberSearchPlaceholder: "Search (Name, Phone, ID)",
    loanBalance: "Loan Balance",
    
    // Loans
    loanManagement: "Loan Management",
    applyLoan: "Apply for Loan",
    newLoanApp: "New Loan Application",
    loanEstimator: "Loan Estimator",
    penaltyTool: "Penalty Tool",
    penaltyManager: "Penalty Manager",
    latePenalties: "Late Penalties",
    pendingApproval: "Pending Approval",
    approve: "Approve",
    reject: "Reject",
    portfolio: "Portfolio",
    monthlyPayment: "Monthly Payment",
    totalInterest: "Total Interest",
    totalRepayment: "Total Repayment",
    
    // Meeting Mode
    startMeeting: "Start Meeting Recording",
    meetingDesc: "Record attendance and transactions for the group meeting.",
    saveMeeting: "Save Meeting Data",
    finesCollected: "Fines Collected",
    loanRepayments: "Loan Repayments",
    present: "Present",
    absent: "Absent",
    late: "Late",
    meetingSaved: "Meeting Saved!",
    meetingSavedDesc: "All transactions have been recorded successfully.",
    startNewMeeting: "Start New Meeting",
    
    // Contributions
    sharesLedger: "Shares Ledger",
    strictRecording: "Strict financial recording",
    newContribution: "New Contribution",
    shareCount: "Share Count",
    solidarity: "Solidarity",
    auditWarning: "All changes are audited. You must provide a valid reason.",
    voidConfirm: "Are you sure you want to void this contribution?",
    
    // Fines
    outstandingFines: "Outstanding Fines",
    collectedSeason: "Collected (Season)",
    manageCategories: "Manage Categories",
    payFine: "Pay Fine",
    recordFine: "Record Fine",
    categoryName: "Category Name",
    addNewCategory: "Add New Category",
    backToList: "Back to List",
    
    // Expenses
    totalExpenses: "Total Expenses (Season)",
    addExpense: "Add Expense",
    
    // Attendance
    attendanceManagement: "Attendance Management",
    scheduleNewMeeting: "Schedule New Meeting",
    regularWeekly: "Regular Weekly",
    specialEvent: "Special Event",
    emergency: "Emergency",
    recordingAttendance: "Recording Attendance",
    correctAttendance: "Correct Attendance",
    
    // Seasons
    cycleManagement: "Cycle Management",
    currentActive: "Current Season Active",
    startedOn: "Started on",
    interestRate: "Interest Rate",
    openForTx: "Open for Transactions",
    closeSeason: "Close Season",
    shareOutReport: "Share-out Report",
    shareOutDesc: "Calculating share-out values requires closing all outstanding loans and reconciling fines.",
    viewReport: "View Final Report",
    simulateShareOut: "Simulate Share-out",
    viewPrevious: "View previous seasons",
    noActiveSeason: "No active season found for this group.",
    startNewSeason: "Start New Season",
    
    // Reports
    reportTypes: "Report Types",
    financial: "Financial",
    operational: "Operational",
    endOfCycle: "End-of-Cycle",
    exportCsv: "Export CSV",
    printPdf: "Print PDF",
    generated: "Generated",
    netPosition: "Net Position",
    inflowsBreakdown: "Inflows Breakdown",
    outflowsBreakdown: "Outflows Breakdown",
    projectedReport: "PROJECTED REPORT (SIMULATION)",
    finalReport: "FINAL CLOSED REPORT",
    totalCash: "Total Cash",
    socialFund: "Social Fund",
    loansAssets: "Loans Assets",
    netWorth: "Net Worth",
    valuePerShare: "Value / Share",
    invested: "Invested",
    profit: "Profit",
    totalPayout: "Total Payout",
    confidential: "Confidential Financial Report",
    
    // Settings
    settingsTitle: "Configuration",
    language: "System Language",
    languageDesc: "Choose between English and Kinyarwanda",
    usersRoles: "Users & Roles",
    usersRolesDesc: "Manage admin access and group leaders",
    manageUsers: "Manage Users",
    dataBackup: "Data & Backup",
    dataBackupDesc: "Export all system data for offline storage",
    exportJson: "Export JSON",
    resetDb: "Reset Database",
    resetDbDesc: "Clear all local data and reset to initial state",
    resetSystem: "Reset System",
    confirmReset: "Are you sure you want to reset the database? This cannot be undone.",

    // Audit & Help
    auditLogs: "Audit Logs",
    userGuide: "User Guide",
    contactSupport: "Contact Support",
    
    // Layout
    notifications: "Notifications",
    markAllRead: "Mark all read",
    noNotifications: "No notifications",
    markRead: "Mark Read",
    logout: "Logout",
    groupSelector: "Group:",
    switchLanguage: "Switch Language",
    helpAssistant: "Help Assistant",
    askMeAnything: "Ask me how to use the system..."
  },
  rw: {
    // General
    appName: "Sisitemu ya VJN GSLA",
    welcome: "Murakaza neza",
    currency: "RWF",
    loading: "Birigutunganywa...",
    noData: "Nta makuru ahari.",
    date: "Itariki",
    amount: "Amafaranga",
    description: "Ubusobanuro",
    type: "Ubwoko",
    actions: "Ibikorwa",
    status: "Imiterere",
    search: "Shakisha...",
    cancel: "Kureka",
    save: "Bika",
    edit: "Hindura",
    delete: "Siba",
    confirm: "Emeza",
    back: "Subira inyuma",
    submit: "Ohereza",
    processing: "Birigukorwa...",
    void: "Tesha agaciro",
    history: "Amateka",
    notes: "Inyandiko",
    reason: "Impamvu",
    viewHistory: "Reba Amateka",
    warning: "Icyitonderwa",
    error: "Ikosa",
    close: "Funga",

    // Dashboard
    totalSavings: "Ubwizigame Bwose",
    loansActive: "Inguzanyo Zatanzwe",
    members: "Abanyamuryango",
    cashBalance: "Amafaranga Ariho",
    overdue: "Ibirarane",
    lateLoans: "Inguzanyo Zakererewe",
    quickActions: "Ibikorwa Byihuse",
    financialTrends: "Imigendekere y'Imari",
    healthIndicators: "Ibipimo by'Ubuzima bw'Itsinda",
    repaymentRate: "Igipimo cyo Kwishyura",
    attendanceRate: "Igipimo cy'Ubwitabire",
    upcomingSchedule: "Gahunda iri imbere",
    nextMeeting: "Inama Itaha",
    loansDueSoon: "Inguzanyo zenda kwishyurwa",
    assetAllocation: "Imiterere y'Umutungo",
    activeSeasons: "Igihembwe Gihari",
    shareValue: "Agaciro k'Umugabane",
    sharesCollected: "Imigabane Yakusanyijwe",
    recordContribution: "Andika Ubwizigame",
    recordRepayment: "Andika Ubwishyu",
    recordNewFine: "Andika Amande Mashya",
    attendance: "Ubwitabire",
    expenses: "Amafaranga Yasohotse",

    // Groups
    groupsManagement: "Gucunga Amatsinda",
    manageGroupsDesc: "Gena imikorere n'amategeko y'amatsinda",
    newGroup: "Itsinda Rishya",
    manageProfile: "Gucunga Itsinda",
    locationDetails: "Amakuru y'Aho riherereye",
    currentStatus: "Imiterere y'Ubu",
    governanceStructure: "Imiterere y'Ubuyobozi",
    financialConfiguration: "Igenamiterere ry'Imari",
    auditTrail: "Inzira y'Ubugenzuzi",
    modifyGroup: "Hindura Itsinda",
    createGroupTitle: "Kurema Itsinda Rishya rya GSLA",
    identification: "Umwirondoro",
    financialRules: "Amategeko y'Imari",

    // Members
    addMember: "Ongeramo Umunyamuryango",
    editMember: "Hindura Umunyamuryango",
    removeMember: "Kuramo Umunyamuryango",
    memberSearchPlaceholder: "Shakisha (Izina, Telefoni, Indangamuntu)",
    loanBalance: "Ideni Asigaje",

    // Loans
    loanManagement: "Gucunga Inguzanyo",
    applyLoan: "Saba Inguzanyo",
    newLoanApp: "Gusaba Inguzanyo Nshya",
    loanEstimator: "Ibalura ry'Inguzanyo",
    penaltyTool: "Gucunga Ibihano",
    penaltyManager: "Gucunga Ibihano",
    latePenalties: "Ibihano by'Ubukererewe",
    pendingApproval: "Itegereje Kwemezwa",
    approve: "Emeza",
    reject: "Hakana",
    portfolio: "Urutonde rw'Inguzanyo",
    monthlyPayment: "Ubwishyu bwa Buri Kwezi",
    totalInterest: "Inyungu Yose",
    totalRepayment: "Ubwishyu Bwose",

    // Meeting Mode
    startMeeting: "Tangira Kwandika Inama",
    meetingDesc: "Andika ubwitabire n'ibikorwa by'amafaranga by'inama.",
    saveMeeting: "Bika Amakuru y'Inama",
    finesCollected: "Amande Yakusanyijwe",
    loanRepayments: "Kwishura Inguzanyo",
    present: "Yitabiriye",
    absent: "Yasibye",
    late: "Yakererewe",
    meetingSaved: "Inama yabitswe!",
    meetingSavedDesc: "Ibyakozwe byose byabitswe neza.",
    startNewMeeting: "Tangira Inama Nshya",

    // Contributions
    sharesLedger: "Igitabo cy'Imigabane",
    strictRecording: "Kwandika iby'imari byitondewe",
    newContribution: "Ubwizigame Bushya",
    shareCount: "Umubare w'Imigabane",
    solidarity: "Ingoboka",
    auditWarning: "Impinduka zose ziragenzurwa. Ugomba gutanga impamvu yumvikana.",
    voidConfirm: "Ese uremera gutesha agaciro ubu bwizigame?",

    // Fines
    outstandingFines: "Amande Atarishyuwe",
    collectedSeason: "Ayakusanyijwe (Igihembwe)",
    manageCategories: "Gucunga Ibyiciro",
    payFine: "Ishyura Amande",
    recordFine: "Andika Amande",
    categoryName: "Izina ry'Icyiciro",
    addNewCategory: "Ongeramo Icyiciro Gishya",
    backToList: "Subira ku Rutonde",

    // Expenses
    totalExpenses: "Amafaranga yose yasohotse (Igihembwe)",
    addExpense: "Ongeramo Ayasohotse",

    // Attendance
    attendanceManagement: "Gucunga Ubwitabire",
    scheduleNewMeeting: "Tegura Inama Nshya",
    regularWeekly: "Isanzwe ya Buri Cyumweru",
    specialEvent: "Igikorwa Cyihariye",
    emergency: "Iyihutirwa",
    recordingAttendance: "Kwandika Ubwitabire",
    correctAttendance: "Gukosora Ubwitabire",

    // Seasons
    cycleManagement: "Gucunga Ibihembwe",
    currentActive: "Igihembwe Gihari",
    startedOn: "Cyatangiye kuwa",
    interestRate: "Inyungu",
    openForTx: "Kirafunguye",
    closeSeason: "Funga Igihembwe",
    shareOutReport: "Raporo yo Kugabana",
    shareOutDesc: "Kubara imigabane bisaba kwishura inguzanyo zose no gukemura amande.",
    viewReport: "Reba Raporo ya Nyuma",
    simulateShareOut: "Gereranya Kugabana",
    viewPrevious: "Reba ibihembwe byashize",
    noActiveSeason: "Nta gihembwe gihari muri iri tsinda.",
    startNewSeason: "Tangira Igihembwe Gishya",

    // Reports
    reportTypes: "Ubwoko bwa Raporo",
    financial: "Imari",
    operational: "Ibikorwa",
    endOfCycle: "Gusoza Igihembwe",
    exportCsv: "Kurura CSV",
    printPdf: "Sohora PDF",
    generated: "Yakozwe",
    netPosition: "Imiterere Rusange",
    inflowsBreakdown: "Aho Amafaranga Yavuye",
    outflowsBreakdown: "Aho Amafaranga Yagiye",
    projectedReport: "RAPORO Y'IGERERANYA",
    finalReport: "RAPORO YA NYUMA",
    totalCash: "Amafaranga Ariho",
    socialFund: "Isanduku y'Ingoboka",
    loansAssets: "Inguzanyo (Umutungo)",
    netWorth: "Umutungo Rusange",
    valuePerShare: "Agaciro k'Umugabane",
    invested: "Yashowe",
    profit: "Inyungu",
    totalPayout: "Ayishyurwa Yose",
    confidential: "Raporo y'Ibanga - Ntigasakazwe",

    // Settings
    settingsTitle: "Igenamiterere",
    language: "Ururimi rwa Sisitemu",
    languageDesc: "Hitamo hagati y'Icyongereza n'Ikinyarwanda",
    usersRoles: "Abakoresha n'Inshingano",
    usersRolesDesc: "Gena uburenganzira bw'abayobozi",
    manageUsers: "Gena Abakoresha",
    dataBackup: "Ububiko",
    dataBackupDesc: "Bika amakuru yose ya sisitemu",
    exportJson: "Kurura JSON",
    resetDb: "Siba Ububiko",
    resetDbDesc: "Siba byose utangire bushya",
    resetSystem: "Siba Sisitemu",
    confirmReset: "Ese urahenganya ushaka gusiba ububiko bwose? Ibi ntibigarurwa.",

    // Audit & Help
    auditLogs: "Raporo y'Ubugenzuzi",
    userGuide: "Imfashanyigisho",
    contactSupport: "Vugisha Ubufasha",

    // Layout
    notifications: "Amatangazo",
    markAllRead: "Byose byasomwe",
    noNotifications: "Nta matangazo ahari",
    markRead: "Tandukaho ko yasomwe",
    logout: "Sohoka",
    groupSelector: "Itsinda:",
    switchLanguage: "Hindura Ururimi",
    helpAssistant: "Umufasha",
    askMeAnything: "Mbaza ikijyanye na sisitemu..."
  }
};

export const HELP_CONTENT = {
  en: [
    {
      id: 'getting-started',
      title: 'Getting Started',
      content: 'Welcome to the VJN GSLA System. This system helps you manage Group Savings and Loans Associations efficiently. To begin, select your group from the dropdown in the top header. If you are setting up for the first time, ensure you have created a Group and started a Season.'
    },
    {
      id: 'meeting-mode',
      title: 'Meeting Mode',
      content: 'Use Meeting Mode during your physical group meetings. It allows you to bulk record attendance, share deposits, loan repayments, and fine payments for all members at once. Simply select the "Present" members and enter their amounts. Click "Save" at the bottom to commit all transactions.'
    },
    {
      id: 'shares',
      title: 'Contributions & Shares',
      content: 'Shares are the core savings of the group. Each share has a fixed value (e.g., 100 RWF). Members can buy between the minimum and maximum allowed shares per meeting. The system tracks the "Share Count" and automatically calculates the value. Do not edit past contributions without a valid reason, as this is audited.'
    },
    {
      id: 'loans',
      title: 'Loans',
      content: 'Members can borrow up to 3 times their total savings (configurable). Loans have a duration and an interest rate (usually 5% per month). Use the "Loan Estimator" tool to calculate repayment schedules. If a loan is overdue, use the "Penalty Tool" to apply fines.'
    },
    {
      id: 'seasons',
      title: 'Seasons & Cycles',
      content: 'A Season (or Cycle) is the operating period of the group (usually 1 year). All transactions must happen within an active season. When the season ends, use the "Share-out Report" to calculate how much money each member receives based on their shares and the group profit.'
    },
    {
      id: 'fines',
      title: 'Fines',
      content: 'Record fines for rule violations (e.g., Late arrival, Phone usage). You can create custom Fine Categories in the Fines module. Attendance fines (Absent/Late) can be automated in the Attendance settings.'
    }
  ],
  rw: [
    {
      id: 'getting-started',
      title: 'Aho uhera',
      content: 'Murakaza neza muri Sisitemu ya VJN GSLA. Iyi sisitemu igufasha gucunga amatsinda yo kuzigama no kugurizanya. Kugirango utangire, hitamo itsinda ryawe hejuru. Niba ari ubwa mbere, banza urebe ko waremye Itsinda kandi ugatangiza Igihembwe.'
    },
    {
      id: 'meeting-mode',
      title: 'Kwandika Inama',
      content: 'Koresha "Inama" igihe muri mu nama y\'itsinda. Igufasha kwandika icyarimwe ubwitabire, imigabane, ubwishyu bw\'inguzanyo, n\'amande ku banyamuryango bose. Hitamo gusa abitabiriye wandike amafaranga batanze. Kanda "Bika" hasi kugirango byose bijye mu bubiko.'
    },
    {
      id: 'shares',
      title: 'Ubwizigame & Imigabane',
      content: 'Imigabane niyo shingiro ry\'ubwizigame. Buri mugabane ufite agaciro kamwe (urugero: 100 RWF). Abanyamuryango bashobora kugura imigabane iri hagati y\'umubare muto n\'umunini wemejwe. Sisitemu ibara agaciro kabyo. Ntugahindure ibyanditswe kera utabifitiye impamvu, kuko biragenzurwa.'
    },
    {
      id: 'loans',
      title: 'Inguzanyo',
      content: 'Umunyamuryango ashobora kugurizwa inshuro 3 z\'ubwizigame bwe (birahindurwa). Inguzanyo zigira igihe n\'inyungu (akenshi 5% ku kwezi). Koresha "Ibalura ry\'Inguzanyo" kureba uko zizishyurwa. Iyo inguzanyo ikererewe, koresha "Gucunga Ibihano" guca amande.'
    },
    {
      id: 'seasons',
      title: 'Ibihembwe',
      content: 'Igihembwe ni igihe itsinda rimara rikola (akenshi umwaka 1). Ibikorwa byose by\'imari bigomba gukorerwa mu gihembwe gifunguye. Iyo kirangiye, koresha "Raporo yo Kugabana" kureba amafaranga buri munyamuryango azahabwa hagendewe ku migabane ye n\'inyungu yabonetse.'
    },
    {
      id: 'fines',
      title: 'Amande',
      content: 'Andika amande y\'abishe amategeko (urugero: Gukererwa, Kuvugira kuri telefoni). Ushobora kurema ibyiciro by\'amande ahanditse Amande. Amande y\'ubwitabire (Gusiba/Gukererwa) ashobora kwikora.'
    }
  ]
};
