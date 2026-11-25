
import { useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileSearch,
  FileText,
  Gauge,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import "./AnalystDashboard.css";

// -------------------------------------
// SAMPLE PREVIEW DATA
// Replace with Firebase/backend results
// -------------------------------------

const MONTHLY_DATA = [
  { month: "Jan", energy: 4200, predicted: 4350 },
  { month: "Feb", energy: 3900, predicted: 4100 },
  { month: "Mar", energy: 4500, predicted: 4450 },
  { month: "Apr", energy: 4100, predicted: 4200 },
  { month: "May", energy: 4800, predicted: 4700 },
  { month: "Jun", energy: 4400, predicted: 4550 },
  { month: "Jul", energy: 4600, predicted: 4750 },
  { month: "Aug", energy: 4300, predicted: 4450 },
];

const PCA_DATA = [
  { component: "PC1", variance: 42 },
  { component: "PC2", variance: 27 },
  { component: "PC3", variance: 16 },
  { component: "PC4", variance: 9 },
  { component: "PC5", variance: 6 },
];

const FACILITY_RANKINGS = [
  { rank: 1, name: "Main Administration Building", code: "FAC-001", score: 0.923, status: "High" },
  { rank: 2, name: "Engineering Block", code: "FAC-002", score: 0.847, status: "High" },
  { rank: 3, name: "Research Laboratory", code: "FAC-003", score: 0.731, status: "Medium" },
];

const INITIAL_OCR_ITEMS = [
  {
    id: 1,
    document: "Electricity_Bill_January.pdf",
    facility: "Main Administration Building",
    date: "2026-01-31",
    status: "Pending",
    energy: "4,250 kWh",
    cost: "RM 2,125.00",
  },
  {
    id: 2,
    document: "Electricity_Bill_February.pdf",
    facility: "Engineering Block",
    date: "2026-02-28",
    status: "Pending",
    energy: "3,800 kWh",
    cost: "RM 1,900.00",
  },
];

// -------------------------------------
// NAVIGATION
// -------------------------------------

const NAV_ITEMS = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "PCA Analysis", icon: BarChart3 },
  { label: "TOPSIS Analysis", icon: Activity },
  { label: "EPI Results", icon: Gauge },
  { label: "Energy Predictions", icon: TrendingUp },
  { label: "Simulation", icon: SlidersHorizontal },
  { label: "OCR Review", icon: FileSearch },
  { label: "Reports", icon: FileText },
];

// -------------------------------------
// REUSABLE COMPONENTS
// -------------------------------------

function AnalystStatCard({ icon: Icon, label, value, description }) {
  return (
    <article className="analyst-stat-card">
      <div className="analyst-stat-icon">
        <Icon size={21} />
      </div>

      <div className="analyst-stat-value">{value}</div>

      <div className="analyst-stat-label">{label}</div>

      <div className="analyst-stat-description">
        {description}
      </div>
    </article>
  );
}

function AnalystPageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="analyst-page-heading">
      <div>
        <span className="analyst-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      {action && (
        <div className="analyst-heading-action">
          {action}
        </div>
      )}
    </div>
  );
}

function AnalystPanel({ title, subtitle, children }) {
  return (
    <section className="analyst-panel">
      <div className="analyst-panel-heading">
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>

      {children}
    </section>
  );
}

// -------------------------------------
// MAIN DASHBOARD
// -------------------------------------

export default function AnalystDashboard({ user, onLogout }) {
  const [activePage, setActivePage] = useState("Overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [simulationReduction, setSimulationReduction] = useState(10);
  const [ocrItems, setOcrItems] = useState(INITIAL_OCR_ITEMS);
  const [searchTerm, setSearchTerm] = useState("");
  const [notice, setNotice] = useState("");

  const displayName =
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "Analyst";

  const pendingOCR = ocrItems.filter(
    (item) => item.status === "Pending"
  ).length;

  const filteredOCR = useMemo(() => {
    return ocrItems.filter((item) => {
      const search = searchTerm.toLowerCase();

      return (
        item.document.toLowerCase().includes(search) ||
        item.facility.toLowerCase().includes(search)
      );
    });
  }, [ocrItems, searchTerm]);

  const estimatedSavings = (
    45000 * simulationReduction / 100
  ).toLocaleString("en-MY", {
    maximumFractionDigits: 2,
  });

  const handleNavigation = (page) => {
    setActivePage(page);
    setMobileMenuOpen(false);
    setNotice("");
    setSearchTerm("");
  };

  const handleOCRStatus = (id, status) => {
    setOcrItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status } : item
      )
    );

    setNotice(
      status === "Reviewed"
        ? "Document marked as reviewed."
        : "Document flagged for correction."
    );
  };

  // -------------------------------------
  // OVERVIEW
  // -------------------------------------

  const renderOverview = () => (
    <>
      <AnalystPageHeading
        eyebrow="ANALYST WORKSPACE"
        title={`Welcome, ${displayName}`}
        description="Monitor analytical performance and review facility energy insights."
        action={
          <span className="analyst-preview-badge">
            Preview Mode
          </span>
        }
      />

      <div className="analyst-stats-grid">
        <AnalystStatCard
          icon={Building2}
          value="03"
          label="Facilities"
          description="Sample facilities"
        />

        <AnalystStatCard
          icon={Activity}
          value="12"
          label="Analysis Runs"
          description="Illustrative activity"
        />

        <AnalystStatCard
          icon={Gauge}
          value="03"
          label="EPI Results"
          description="Sample results"
        />

        <AnalystStatCard
          icon={FileSearch}
          value={String(pendingOCR).padStart(2, "0")}
          label="Pending OCR"
          description="Documents awaiting review"
        />
      </div>

      <div className="analyst-content-grid">
        <AnalystPanel
          title="Energy Consumption Trend"
          subtitle="Illustrative monthly energy consumption (kWh)"
        >
          <div className="analyst-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_DATA}>
                <defs>
                  <linearGradient
                    id="energyGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#3182ce"
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="95%"
                      stopColor="#3182ce"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" vertical={false} />

                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="energy"
                  stroke="#3182ce"
                  fill="url(#energyGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </AnalystPanel>

        <AnalystPanel
          title="Analytical Modules"
          subtitle="Access your analysis tools"
        >
          <div className="analyst-quick-links">
            {NAV_ITEMS.slice(1, 7).map((item) => {
              const Icon = item.icon;

              return (
                <button
                  type="button"
                  className="analyst-quick-link"
                  key={item.label}
                  onClick={() => handleNavigation(item.label)}
                >
                  <span className="analyst-quick-icon">
                    <Icon size={18} />
                  </span>

                  <span>{item.label}</span>

                  <ChevronRight size={17} />
                </button>
              );
            })}
          </div>
        </AnalystPanel>
      </div>

      <AnalystPanel
        title="Recent OCR Documents"
        subtitle="Documents requiring analyst attention"
      >
        {pendingOCR === 0 ? (
          <div className="analyst-empty">
            No pending OCR documents.
          </div>
        ) : (
          <div className="analyst-document-list">
            {ocrItems
              .filter((item) => item.status === "Pending")
              .map((item) => (
                <div className="analyst-document-row" key={item.id}>
                  <FileText size={21} />

                  <div>
                    <strong>{item.document}</strong>
                    <span>{item.facility}</span>
                  </div>

                  <span className="analyst-status pending">
                    Pending
                  </span>

                  <button
                    type="button"
                    className="analyst-text-button"
                    onClick={() => handleNavigation("OCR Review")}
                  >
                    Review
                  </button>
                </div>
              ))}
          </div>
        )}
      </AnalystPanel>
    </>
  );

  // -------------------------------------
  // PCA ANALYSIS
  // -------------------------------------

  const renderPCA = () => (
    <>
      <AnalystPageHeading
        eyebrow="DATA ANALYSIS"
        title="Principal Component Analysis"
        description="Explore dimensionality reduction and variance explained by principal components."
      />

      <div className="analyst-info-banner">
        <Activity size={20} />
        <span>
          This is a demonstration of the PCA results interface.
          Actual component calculations are not connected yet.
        </span>
      </div>

      <div className="analyst-stats-grid">
        <AnalystStatCard
          icon={BarChart3}
          value="05"
          label="Components"
          description="Illustrative components"
        />

        <AnalystStatCard
          icon={TrendingUp}
          value="85%"
          label="Variance Explained"
          description="Sample cumulative variance"
        />

        <AnalystStatCard
          icon={Building2}
          value="03"
          label="Facilities"
          description="Sample dataset"
        />

        <AnalystStatCard
          icon={Activity}
          value="08"
          label="Variables"
          description="Illustrative input variables"
        />
      </div>

      <AnalystPanel
        title="Explained Variance by Component"
        subtitle="Illustrative percentage of variance"
      >
        <div className="analyst-chart large">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={PCA_DATA}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="component" />
              <YAxis unit="%" />
              <Tooltip formatter={(value) => `${value}%`} />
              <Bar
                dataKey="variance"
                fill="#397eb8"
                radius={[5, 5, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </AnalystPanel>

      <AnalystPanel
        title="Component Summary"
        subtitle="Sample PCA output"
      >
        <div className="analyst-table-wrap">
          <table className="analyst-table">
            <thead>
              <tr>
                <th>Component</th>
                <th>Explained Variance</th>
                <th>Cumulative Variance</th>
              </tr>
            </thead>

            <tbody>
              {PCA_DATA.map((item, index) => {
                const cumulative = PCA_DATA
                  .slice(0, index + 1)
                  .reduce((total, row) => total + row.variance, 0);

                return (
                  <tr key={item.component}>
                    <td>{item.component}</td>
                    <td>{item.variance}%</td>
                    <td>{cumulative}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </AnalystPanel>
    </>
  );

  // -------------------------------------
  // TOPSIS ANALYSIS
  // -------------------------------------

  const renderTOPSIS = () => (
    <>
      <AnalystPageHeading
        eyebrow="MULTI-CRITERIA DECISION ANALYSIS"
        title="TOPSIS Analysis"
        description="Compare and rank facilities based on their relative energy performance."
      />

      <div className="analyst-info-banner">
        <ShieldCheck size={20} />
        <span>
          Facility rankings below are sample values, not calculated TOPSIS results.
        </span>
      </div>

      <AnalystPanel
        title="Facility Ranking"
        subtitle="Sample closeness coefficients"
      >
        <div className="analyst-table-wrap">
          <table className="analyst-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Facility</th>
                <th>Facility Code</th>
                <th>TOPSIS Score</th>
                <th>Performance</th>
              </tr>
            </thead>

            <tbody>
              {FACILITY_RANKINGS.map((item) => (
                <tr key={item.code}>
                  <td>
                    <span className="analyst-rank">
                      {item.rank}
                    </span>
                  </td>

                  <td>{item.name}</td>
                  <td>{item.code}</td>
                  <td>{item.score.toFixed(3)}</td>
                  <td>
                    <span className={`analyst-status ${item.status.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AnalystPanel>

      <AnalystPanel
        title="TOPSIS Score Comparison"
        subtitle="Higher scores indicate greater relative closeness to the ideal solution"
      >
        <div className="analyst-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={FACILITY_RANKINGS}
              layout="vertical"
              margin={{ left: 15, right: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 1]} />
              <YAxis
                type="category"
                dataKey="code"
                width={80}
              />
              <Tooltip />
              <Bar
                dataKey="score"
                fill="#397eb8"
                radius={[0, 5, 5, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </AnalystPanel>
    </>
  );

  // -------------------------------------
  // EPI RESULTS
  // -------------------------------------

  const renderEPI = () => (
    <>
      <AnalystPageHeading
        eyebrow="ENERGY PERFORMANCE"
        title="Energy Performance Index"
        description="Review facility energy performance and compare historical trends."
      />

      <div className="analyst-info-banner">
        <Gauge size={20} />
        <span>
          EPI values and trends are illustrative until connected to the EPI calculation service.
        </span>
      </div>

      <div className="analyst-stats-grid">
        <AnalystStatCard
          icon={Gauge}
          value="0.82"
          label="Sample Average EPI"
          description="Illustrative index"
        />

        <AnalystStatCard
          icon={Building2}
          value="03"
          label="Facilities Compared"
          description="Sample facilities"
        />

        <AnalystStatCard
          icon={TrendingUp}
          value="8.5%"
          label="Sample Improvement"
          description="Illustrative comparison"
        />

        <AnalystStatCard
          icon={CalendarDays}
          value="08"
          label="Monthly Periods"
          description="Sample reporting periods"
        />
      </div>

      <AnalystPanel
        title="Monthly EPI Trend"
        subtitle="Illustrative facility performance index"
      >
        <div className="analyst-chart large">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={MONTHLY_DATA}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="energy"
                name="Illustrative energy series"
                stroke="#397eb8"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </AnalystPanel>
    </>
  );

  // -------------------------------------
  // ENERGY PREDICTIONS
  // -------------------------------------

  const renderPredictions = () => (
    <>
      <AnalystPageHeading
        eyebrow="ENERGY FORECASTING"
        title="Energy Predictions"
        description="Review historical consumption and illustrative forecast results."
      />

      <div className="analyst-info-banner">
        <TrendingUp size={20} />
        <span>
          Forecast values are demonstration data. Connect the prediction service before using them for decisions.
        </span>
      </div>

      <AnalystPanel
        title="Historical vs Predicted Consumption"
        subtitle="Illustrative energy consumption in kWh"
      >
        <div className="analyst-chart large">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={MONTHLY_DATA}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />

              <Line
                type="monotone"
                dataKey="energy"
                name="Historical"
                stroke="#397eb8"
                strokeWidth={2}
              />

              <Line
                type="monotone"
                dataKey="predicted"
                name="Predicted"
                stroke="#16a085"
                strokeWidth={2}
                strokeDasharray="6 4"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </AnalystPanel>

      <AnalystPanel
        title="Prediction Summary"
        subtitle="Illustrative forecast information"
      >
        <div className="analyst-summary-grid">
          <div>
            <span>Forecast period</span>
            <strong>Next 3 months</strong>
          </div>

          <div>
            <span>Model</span>
            <strong>Pending backend connection</strong>
          </div>

          <div>
            <span>Forecast status</span>
            <strong>Preview only</strong>
          </div>
        </div>
      </AnalystPanel>
    </>
  );

  // -------------------------------------
  // SIMULATION
  // -------------------------------------

  const renderSimulation = () => (
    <>
      <AnalystPageHeading
        eyebrow="SCENARIO ANALYSIS"
        title="Energy Simulation"
        description="Explore how hypothetical energy reduction scenarios affect consumption and costs."
      />

      <div className="analyst-info-banner">
        <SlidersHorizontal size={20} />
        <span>
          This is a frontend scenario preview. It is not connected to the simulation analysis service.
        </span>
      </div>

      <AnalystPanel
        title="Scenario Configuration"
        subtitle="Adjust the hypothetical energy reduction percentage"
      >
        <div className="analyst-simulation-control">
          <label htmlFor="simulation-reduction">
            Energy Reduction Target
          </label>

          <strong>{simulationReduction}%</strong>

          <input
            id="simulation-reduction"
            type="range"
            min="0"
            max="50"
            step="5"
            value={simulationReduction}
            onChange={(event) =>
              setSimulationReduction(Number(event.target.value))
            }
          />

          <div className="analyst-range-labels">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
          </div>
        </div>
      </AnalystPanel>

      <div className="analyst-stats-grid">
        <AnalystStatCard
          icon={Zap}
          value={`${simulationReduction}%`}
          label="Reduction Target"
          description="Selected scenario"
        />

        <AnalystStatCard
          icon={TrendingUp}
          value={`RM ${estimatedSavings}`}
          label="Illustrative Savings"
          description="Based on RM 45,000 baseline"
        />

        <AnalystStatCard
          icon={Activity}
          value={`${(45000 * (1 - simulationReduction / 100)).toLocaleString("en-MY", { maximumFractionDigits: 2 })}`}
          label="Remaining Cost"
          description="Illustrative RM baseline"
        />
      </div>

      <AnalystPanel
        title="Scenario Summary"
        subtitle="Hypothetical scenario calculation"
      >
        <div className="analyst-scenario-result">
          <CheckCircle2 size={26} />

          <div>
            <strong>
              {simulationReduction}% energy reduction scenario
            </strong>

            <p>
              The illustrative calculation estimates RM {estimatedSavings}
              {" "}in savings against a baseline cost of RM 45,000.
              This is not an actual simulation result.
            </p>
          </div>
        </div>
      </AnalystPanel>
    </>
  );

  // -------------------------------------
  // OCR REVIEW
  // -------------------------------------

  const renderOCR = () => (
    <>
      <AnalystPageHeading
        eyebrow="DOCUMENT PROCESSING"
        title="OCR Review"
        description="Inspect extracted information and review document values before acceptance."
      />

      <div className="analyst-info-banner">
        <FileSearch size={20} />
        <span>
          OCR documents shown here are sample entries. Actual documents must be retrieved from the OCR service.
        </span>
      </div>

      <div className="analyst-stats-grid">
        <AnalystStatCard
          icon={FileText}
          value={String(ocrItems.length).padStart(2, "0")}
          label="Total Documents"
          description="Sample documents"
        />

        <AnalystStatCard
          icon={Clock3}
          value={String(pendingOCR).padStart(2, "0")}
          label="Pending Review"
          description="Awaiting analyst action"
        />

        <AnalystStatCard
          icon={CheckCircle2}
          value={String(ocrItems.filter((item) => item.status === "Reviewed").length).padStart(2, "0")}
          label="Reviewed"
          description="Reviewed in this session"
        />
      </div>

      <AnalystPanel
        title="Document Extraction Records"
        subtitle="Search, inspect and review extracted values"
      >
        <div className="analyst-search-wrap">
          <Search size={18} />

          <input
            type="search"
            placeholder="Search document or facility..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        {notice && (
          <div className="analyst-notice">
            <CheckCircle2 size={17} />
            {notice}
          </div>
        )}

        <div className="analyst-ocr-list">
          {filteredOCR.map((item) => (
            <article className="analyst-ocr-card" key={item.id}>
              <div className="analyst-ocr-header">
                <div className="analyst-ocr-file">
                  <FileText size={21} />
                  <div>
                    <strong>{item.document}</strong>
                    <span>{item.facility}</span>
                  </div>
                </div>

                <span className={`analyst-status ${item.status.toLowerCase()}`}>
                  {item.status}
                </span>
              </div>

              <div className="analyst-ocr-values">
                <div>
                  <span>Extraction date</span>
                  <strong>{item.date}</strong>
                </div>

                <div>
                  <span>Energy extracted</span>
                  <strong>{item.energy}</strong>
                </div>

                <div>
                  <span>Cost extracted</span>
                  <strong>{item.cost}</strong>
                </div>
              </div>

              {item.status === "Pending" && (
                <div className="analyst-ocr-actions">
                  <button
                    type="button"
                    className="analyst-secondary-button"
                    onClick={() => handleOCRStatus(item.id, "Flagged")}
                  >
                    Flag for Correction
                  </button>

                  <button
                    type="button"
                    className="analyst-primary-button"
                    onClick={() => handleOCRStatus(item.id, "Reviewed")}
                  >
                    <CheckCircle2 size={16} />
                    Mark Reviewed
                  </button>
                </div>
              )}
            </article>
          ))}

          {filteredOCR.length === 0 && (
            <div className="analyst-empty">
              No matching OCR documents found.
            </div>
          )}
        </div>
      </AnalystPanel>
    </>
  );

  // -------------------------------------
  // REPORTS
  // -------------------------------------

  const renderReports = () => (
    <>
      <AnalystPageHeading
        eyebrow="ANALYTICAL REPORTING"
        title="Reports"
        description="Review available analytical report categories and their current development status."
      />

      <div className="analyst-info-banner">
        <FileText size={20} />
        <span>
          Report generation and PDF exports will be connected to the analytical backend in a later stage.
        </span>
      </div>

      <div className="analyst-report-grid">
        {[
          {
            title: "PCA Analysis Report",
            description: "Principal components and explained variance.",
            icon: BarChart3,
          },
          {
            title: "TOPSIS Ranking Report",
            description: "Comparative facility performance ranking.",
            icon: Activity,
          },
          {
            title: "EPI Performance Report",
            description: "Energy performance index results.",
            icon: Gauge,
          },
          {
            title: "Energy Prediction Report",
            description: "Historical and forecast consumption.",
            icon: TrendingUp,
          },
          {
            title: "Simulation Report",
            description: "Scenario assumptions and outcomes.",
            icon: SlidersHorizontal,
          },
          {
            title: "OCR Review Report",
            description: "Document extraction review status.",
            icon: FileSearch,
          },
        ].map((report) => {
          const Icon = report.icon;

          return (
            <article className="analyst-report-card" key={report.title}>
              <span className="analyst-report-icon">
                <Icon size={23} />
              </span>

              <h3>{report.title}</h3>
              <p>{report.description}</p>

              <span className="analyst-report-status">
                <Clock3 size={14} />
                Backend connection pending
              </span>
            </article>
          );
        })}
      </div>
    </>
  );

  // -------------------------------------
  // PAGE ROUTING
  // -------------------------------------

  const pageContent = {
    Overview: renderOverview,
    "PCA Analysis": renderPCA,
    "TOPSIS Analysis": renderTOPSIS,
    "EPI Results": renderEPI,
    "Energy Predictions": renderPredictions,
    Simulation: renderSimulation,
    "OCR Review": renderOCR,
    Reports: renderReports,
  };

  return (
    <div className="analyst-layout">

      {mobileMenuOpen && (
        <button
          type="button"
          className="analyst-mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}

      <aside className={`analyst-sidebar ${mobileMenuOpen ? "open" : ""}`}>

        <div className="analyst-brand">
          <span className="analyst-brand-icon">
            <Zap size={23} fill="currentColor" />
          </span>

          <div>
            <strong>EnergyLens</strong>
            <span>ANALYTICS PLATFORM</span>
          </div>

          <button
            type="button"
            className="analyst-mobile-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="analyst-role-label">
          ANALYST WORKSPACE
        </div>

        <nav className="analyst-navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activePage === item.label;

            return (
              <button
                key={item.label}
                type="button"
                className={`analyst-nav-item ${active ? "active" : ""}`}
                onClick={() => handleNavigation(item.label)}
              >
                <Icon size={19} />
                <span>{item.label}</span>

                {active && (
                  <span className="analyst-nav-indicator" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="analyst-sidebar-bottom">
          <div className="analyst-user-card">
            <span className="analyst-avatar">
              {displayName.charAt(0).toUpperCase()}
            </span>

            <div>
              <strong>{displayName}</strong>
              <span>Analyst</span>
            </div>
          </div>

          <button
            type="button"
            className="analyst-logout-button"
            onClick={onLogout}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}

      <main className="analyst-main">

        <header className="analyst-topbar">
          <div className="analyst-topbar-left">
            <button
              type="button"
              className="analyst-menu-toggle"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={21} />
            </button>

            <div>
              <span>EnergyLens / Analyst</span>
              <strong>{activePage}</strong>
            </div>
          </div>

          <div className="analyst-topbar-user">
            <span className="analyst-topbar-role">
              <ShieldCheck size={15} />
              Analyst Access
            </span>
          </div>
        </header>

        <div className="analyst-page-content">
          {pageContent[activePage]()}
        </div>

        <footer className="analyst-footer">
          EnergyLens Management System
          <span>Analyst Workspace · Preview Version</span>
        </footer>

      </main>
    </div>
  );
}
