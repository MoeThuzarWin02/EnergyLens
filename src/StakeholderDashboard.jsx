
import { useMemo, useState } from "react";
import ProfilePage from "./components/ProfilePage";
import {
  Activity,
  Building2,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  FileText,
  Gauge,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  TrendingUp,
  Wallet,
  X,
  Zap,
  MapPin,
  Eye,
  UserRound,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

import "./StakeholderDashboard.css";

// ========================================
// DEMONSTRATION DATA
// Replace with Firebase data later.
// ========================================

const FACILITIES = [
  {
    id: "FAC001",
    name: "Main Administration Building",
    location: "Kedah",
    energy: 35450,
    cost: 17725,
    epi: 0.82,
  },
  {
    id: "FAC002",
    name: "Engineering Block",
    location: "Kedah",
    energy: 42600,
    cost: 21300,
    epi: 0.76,
  },
  {
    id: "FAC003",
    name: "Research Laboratory",
    location: "Kedah",
    energy: 23950,
    cost: 11975,
    epi: 0.91,
  },
];

const MONTHLY_DATA = [
  {
    month: "Jan",
    totalEnergy: 12100,
    totalCost: 6050,
    FAC001: 4200,
    FAC002: 5100,
    FAC003: 2800,
    costFAC001: 2100,
    costFAC002: 2550,
    costFAC003: 1400,
  },
  {
    month: "Feb",
    totalEnergy: 11500,
    totalCost: 5750,
    FAC001: 4000,
    FAC002: 4900,
    FAC003: 2600,
    costFAC001: 2000,
    costFAC002: 2450,
    costFAC003: 1300,
  },
  {
    month: "Mar",
    totalEnergy: 12900,
    totalCost: 6450,
    FAC001: 4500,
    FAC002: 5300,
    FAC003: 3100,
    costFAC001: 2250,
    costFAC002: 2650,
    costFAC003: 1550,
  },
  {
    month: "Apr",
    totalEnergy: 12400,
    totalCost: 6200,
    FAC001: 4300,
    FAC002: 5200,
    FAC003: 2900,
    costFAC001: 2150,
    costFAC002: 2600,
    costFAC003: 1450,
  },
  {
    month: "May",
    totalEnergy: 13800,
    totalCost: 6900,
    FAC001: 4800,
    FAC002: 5700,
    FAC003: 3300,
    costFAC001: 2400,
    costFAC002: 2850,
    costFAC003: 1650,
  },
  {
    month: "Jun",
    totalEnergy: 13100,
    totalCost: 6550,
    FAC001: 4550,
    FAC002: 5500,
    FAC003: 3050,
    costFAC001: 2275,
    costFAC002: 2750,
    costFAC003: 1525,
  },
  {
    month: "Jul",
    totalEnergy: 13500,
    totalCost: 6750,
    FAC001: 4700,
    FAC002: 5600,
    FAC003: 3200,
    costFAC001: 2350,
    costFAC002: 2800,
    costFAC003: 1600,
  },
  {
    month: "Aug",
    totalEnergy: 12700,
    totalCost: 6350,
    FAC001: 4400,
    FAC002: 5300,
    FAC003: 3000,
    costFAC001: 2200,
    costFAC002: 2650,
    costFAC003: 1500,
  },
];

const NAV_ITEMS = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Energy Monitoring", icon: Zap },
  { label: "Cost Monitoring", icon: Wallet },
  { label: "EPI Performance", icon: Gauge },
  { label: "Facility Comparison", icon: Building2 },
  { label: "Reports", icon: FileText },
];

// ========================================
// HELPER FUNCTIONS
// ========================================

const formatNumber = (value) =>
  Number(value).toLocaleString("en-MY");

const formatRM = (value) =>
  `RM ${Number(value).toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// ========================================
// REUSABLE COMPONENTS
// ========================================

function StakeholderStatCard({
  icon: Icon,
  value,
  label,
  description,
}) {
  return (
    <article className="stakeholder-stat-card">
      <span className="stakeholder-stat-icon">
        <Icon size={21} />
      </span>

      <strong className="stakeholder-stat-value">
        {value}
      </strong>

      <span className="stakeholder-stat-label">
        {label}
      </span>

      <span className="stakeholder-stat-description">
        {description}
      </span>
    </article>
  );
}

function StakeholderPanel({
  title,
  subtitle,
  children,
}) {
  return (
    <section className="stakeholder-panel">
      <div className="stakeholder-panel-heading">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>

      {children}
    </section>
  );
}

function StakeholderPageHeading({
  eyebrow,
  title,
  description,
}) {
  return (
    <div className="stakeholder-page-heading">
      <div>
        <span className="stakeholder-eyebrow">
          {eyebrow}
        </span>

        <h1>{title}</h1>

        <p>{description}</p>
      </div>

      <span className="stakeholder-preview-badge">
        Preview Mode
      </span>
    </div>
  );
}

// ========================================
// MAIN STAKEHOLDER DASHBOARD
// ========================================

export default function StakeholderDashboard({
  user,
  onLogout,
  onSavePhoto,
}) {
  const [activePage, setActivePage] = useState("Overview");

  const [selectedFacility, setSelectedFacility] =
    useState("All Facilities");

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const displayName =
    user?.displayName ||
    user?.name ||
    user?.email?.split("@")[0] ||
    "EnergyLens Stakeholder";

  // -------------------------------------
  // FILTER DATA
  // -------------------------------------

  const filteredFacilities = useMemo(() => {
    if (selectedFacility === "All Facilities") {
      return FACILITIES;
    }

    return FACILITIES.filter(
      (facility) => facility.id === selectedFacility
    );
  }, [selectedFacility]);

  const chartData = useMemo(() => {
    return MONTHLY_DATA.map((item) => {
      if (selectedFacility === "All Facilities") {
        return {
          month: item.month,
          energy: item.totalEnergy,
          cost: item.totalCost,
        };
      }

      return {
        month: item.month,
        energy: item[selectedFacility],
        cost: item[`cost${selectedFacility}`],
      };
    });
  }, [selectedFacility]);

  const totalEnergy = filteredFacilities.reduce(
    (total, facility) => total + facility.energy,
    0
  );

  const totalCost = filteredFacilities.reduce(
    (total, facility) => total + facility.cost,
    0
  );

  const averageEPI =
    filteredFacilities.length > 0
      ? filteredFacilities.reduce(
          (total, facility) => total + facility.epi,
          0
        ) / filteredFacilities.length
      : 0;

  // -------------------------------------
  // NAVIGATION
  // -------------------------------------

  const handleNavigation = (page) => {
    setActivePage(page);
    setMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
  };

  // -------------------------------------
  // OVERVIEW
  // -------------------------------------

  const renderOverview = () => (
    <>
      <StakeholderPageHeading
        eyebrow="FACILITY MONITORING"
        title={`Welcome, ${displayName}`}
        description="Monitor facility energy consumption, electricity costs and overall energy performance."
      />

      <div className="stakeholder-info-banner">
        <Eye size={19} />

        <span>
          Stakeholder access is read-only. You can monitor
          facility performance and review reports but cannot
          modify system records.
        </span>
      </div>

      <div className="stakeholder-stats-grid">
        <StakeholderStatCard
          icon={Building2}
          value={String(filteredFacilities.length).padStart(2, "0")}
          label="Facilities Monitored"
          description="Registered facilities"
        />

        <StakeholderStatCard
          icon={Zap}
          value={`${formatNumber(totalEnergy)}`}
          label="Energy Consumption"
          description="Sample reporting period (kWh)"
        />

        <StakeholderStatCard
          icon={Wallet}
          value={formatRM(totalCost)}
          label="Electricity Cost"
          description="Sample reporting period"
        />

        <StakeholderStatCard
          icon={Gauge}
          value={averageEPI.toFixed(2)}
          label="Average EPI"
          description="Illustrative performance index"
        />
      </div>

      <StakeholderPanel
        title="Energy Consumption Trend"
        subtitle="Monthly electricity consumption in kWh"
      >
        <div className="stakeholder-chart large">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient
                  id="stakeholderEnergyGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="#327eb8"
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="95%"
                    stopColor="#327eb8"
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis dataKey="month" />

              <YAxis />

              <Tooltip
                formatter={(value) => [
                  `${formatNumber(value)} kWh`,
                  "Consumption",
                ]}
              />

              <Area
                type="monotone"
                dataKey="energy"
                stroke="#327eb8"
                strokeWidth={2.5}
                fill="url(#stakeholderEnergyGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </StakeholderPanel>

      <div className="stakeholder-content-grid">
        <StakeholderPanel
          title="Electricity Cost Trend"
          subtitle="Monthly electricity expenses (RM)"
        >
          <div className="stakeholder-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis dataKey="month" />

                <YAxis />

                <Tooltip
                  formatter={(value) => [
                    formatRM(value),
                    "Electricity Cost",
                  ]}
                />

                <Line
                  type="monotone"
                  dataKey="cost"
                  stroke="#16a085"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </StakeholderPanel>

        <StakeholderPanel
          title="Facility Performance"
          subtitle="Summary of registered facilities"
        >
          <div className="stakeholder-facility-list">
            {filteredFacilities.map((facility) => (
              <div
                className="stakeholder-facility-row"
                key={facility.id}
              >
                <span className="stakeholder-facility-icon">
                  <Building2 size={19} />
                </span>

                <div>
                  <strong>{facility.name}</strong>
                  <span>
                    {facility.id} · {facility.location}
                  </span>
                </div>

                <span className="stakeholder-facility-status">
                  <CheckCircle2 size={13} />
                  Active
                </span>
              </div>
            ))}
          </div>
        </StakeholderPanel>
      </div>

      <StakeholderPanel
        title="Facility Energy Summary"
        subtitle="Consumption and EPI overview"
      >
        {renderFacilityTable()}
      </StakeholderPanel>
    </>
  );

  // -------------------------------------
  // FACILITY TABLE
  // -------------------------------------

  const renderFacilityTable = () => (
    <div className="stakeholder-table-wrap">
      <table className="stakeholder-table">
        <thead>
          <tr>
            <th>Facility</th>
            <th>Facility Code</th>
            <th>Energy (kWh)</th>
            <th>Electricity Cost</th>
            <th>EPI</th>
          </tr>
        </thead>

        <tbody>
          {filteredFacilities.map((facility) => (
            <tr key={facility.id}>
              <td>{facility.name}</td>
              <td>{facility.id}</td>
              <td>{formatNumber(facility.energy)}</td>
              <td>{formatRM(facility.cost)}</td>
              <td>
                <span className="stakeholder-epi-value">
                  {facility.epi.toFixed(2)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // -------------------------------------
  // ENERGY MONITORING
  // -------------------------------------

  const renderEnergy = () => (
    <>
      <StakeholderPageHeading
        eyebrow="ENERGY MONITORING"
        title="Energy Consumption"
        description="Monitor electricity consumption and review monthly energy usage."
      />

      <div className="stakeholder-stats-grid">
        <StakeholderStatCard
          icon={Zap}
          value={formatNumber(totalEnergy)}
          label="Total Consumption"
          description="Sample reporting period (kWh)"
        />

        <StakeholderStatCard
          icon={Building2}
          value={String(filteredFacilities.length).padStart(2, "0")}
          label="Facilities"
          description="Selected facilities"
        />

        <StakeholderStatCard
          icon={Activity}
          value={formatNumber(
            Math.round(totalEnergy / MONTHLY_DATA.length)
          )}
          label="Average Monthly Usage"
          description="kWh per month"
        />

        <StakeholderStatCard
          icon={TrendingUp}
          value="08"
          label="Reporting Periods"
          description="Illustrative months"
        />
      </div>

      <StakeholderPanel
        title="Monthly Energy Consumption"
        subtitle="Energy usage across the selected facilities"
      >
        <div className="stakeholder-chart large">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis dataKey="month" />

              <YAxis />

              <Tooltip
                formatter={(value) => [
                  `${formatNumber(value)} kWh`,
                  "Consumption",
                ]}
              />

              <Area
                type="monotone"
                dataKey="energy"
                stroke="#327eb8"
                strokeWidth={2.5}
                fill="#dcecf8"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </StakeholderPanel>

      <StakeholderPanel
        title="Facility Consumption Comparison"
        subtitle="Total energy consumption by facility"
      >
        <div className="stakeholder-chart large">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredFacilities}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis dataKey="id" />

              <YAxis />

              <Tooltip
                formatter={(value) => [
                  `${formatNumber(value)} kWh`,
                  "Consumption",
                ]}
              />

              <Bar
                dataKey="energy"
                name="Energy Consumption"
                fill="#397eb8"
                radius={[5, 5, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </StakeholderPanel>
    </>
  );

  // -------------------------------------
  // COST MONITORING
  // -------------------------------------

  const renderCosts = () => (
    <>
      <StakeholderPageHeading
        eyebrow="FINANCIAL MONITORING"
        title="Electricity Cost Monitoring"
        description="Review electricity expenditure and compare facility costs."
      />

      <div className="stakeholder-stats-grid">
        <StakeholderStatCard
          icon={Wallet}
          value={formatRM(totalCost)}
          label="Total Electricity Cost"
          description="Sample reporting period"
        />

        <StakeholderStatCard
          icon={Building2}
          value={String(filteredFacilities.length).padStart(2, "0")}
          label="Facilities"
          description="Selected facilities"
        />

        <StakeholderStatCard
          icon={Activity}
          value={formatRM(
            totalCost / MONTHLY_DATA.length
          )}
          label="Average Monthly Cost"
          description="RM per month"
        />

        <StakeholderStatCard
          icon={TrendingUp}
          value="RM 0.50"
          label="Sample Unit Rate"
          description="Illustrative rate only"
        />
      </div>

      <StakeholderPanel
        title="Monthly Electricity Cost"
        subtitle="Monthly electricity expenditure (RM)"
      >
        <div className="stakeholder-chart large">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis dataKey="month" />

              <YAxis />

              <Tooltip
                formatter={(value) => [
                  formatRM(value),
                  "Electricity Cost",
                ]}
              />

              <Area
                type="monotone"
                dataKey="cost"
                stroke="#16a085"
                strokeWidth={2.5}
                fill="#d9f2eb"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </StakeholderPanel>

      <StakeholderPanel
        title="Facility Cost Comparison"
        subtitle="Electricity expenditure by facility"
      >
        <div className="stakeholder-chart large">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredFacilities}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis dataKey="id" />

              <YAxis />

              <Tooltip
                formatter={(value) => [
                  formatRM(value),
                  "Electricity Cost",
                ]}
              />

              <Bar
                dataKey="cost"
                fill="#16a085"
                radius={[5, 5, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </StakeholderPanel>
    </>
  );

  // -------------------------------------
  // EPI PERFORMANCE
  // -------------------------------------

  const renderEPI = () => (
    <>
      <StakeholderPageHeading
        eyebrow="ENERGY PERFORMANCE"
        title="Energy Performance Index"
        description="Review the sample EPI values of registered facilities."
      />

      <div className="stakeholder-info-banner">
        <Gauge size={19} />

        <span>
          EPI values are illustrative. The actual calculation
          formula, units and performance thresholds must be
          confirmed before interpreting these values.
        </span>
      </div>

      <div className="stakeholder-stats-grid">
        <StakeholderStatCard
          icon={Gauge}
          value={averageEPI.toFixed(2)}
          label="Average EPI"
          description="Selected facilities"
        />

        <StakeholderStatCard
          icon={Building2}
          value={String(filteredFacilities.length).padStart(2, "0")}
          label="Facilities Compared"
          description="Selected facilities"
        />

        <StakeholderStatCard
          icon={TrendingUp}
          value={
            filteredFacilities.length
              ? Math.max(
                  ...filteredFacilities.map((item) => item.epi)
                ).toFixed(2)
              : "—"
          }
          label="Highest Sample EPI"
          description="Illustrative score"
        />

        <StakeholderStatCard
          icon={Activity}
          value={
            filteredFacilities.length
              ? Math.min(
                  ...filteredFacilities.map((item) => item.epi)
                ).toFixed(2)
              : "—"
          }
          label="Lowest Sample EPI"
          description="Illustrative score"
        />
      </div>

      <StakeholderPanel
        title="Facility EPI Comparison"
        subtitle="Illustrative EPI values"
      >
        <div className="stakeholder-chart large">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredFacilities}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis dataKey="id" />

              <YAxis domain={[0, 1]} />

              <Tooltip
                formatter={(value) => [
                  Number(value).toFixed(2),
                  "EPI",
                ]}
              />

              <Bar
                dataKey="epi"
                fill="#397eb8"
                radius={[5, 5, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </StakeholderPanel>

      <StakeholderPanel
        title="EPI Facility Summary"
        subtitle="Sample performance index records"
      >
        {renderFacilityTable()}
      </StakeholderPanel>
    </>
  );

  // -------------------------------------
  // FACILITY COMPARISON
  // -------------------------------------

  const renderComparison = () => (
    <>
      <StakeholderPageHeading
        eyebrow="FACILITY ANALYTICS"
        title="Facility Comparison"
        description="Compare energy consumption, electricity costs and EPI values across facilities."
      />

      <div className="stakeholder-info-banner">
        <Building2 size={19} />

        <span>
          This page provides a read-only comparison of
          facility performance using demonstration data.
        </span>
      </div>

      <StakeholderPanel
        title="Energy Consumption Comparison"
        subtitle="Total consumption by facility (kWh)"
      >
        <div className="stakeholder-chart large">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredFacilities}
              layout="vertical"
              margin={{ left: 15, right: 25 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
              />

              <XAxis type="number" />

              <YAxis
                type="category"
                dataKey="id"
                width={80}
              />

              <Tooltip
                formatter={(value) => [
                  `${formatNumber(value)} kWh`,
                  "Consumption",
                ]}
              />

              <Bar
                dataKey="energy"
                fill="#397eb8"
                radius={[0, 5, 5, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </StakeholderPanel>

      <StakeholderPanel
        title="Facility Comparison Table"
        subtitle="Energy, cost and performance summary"
      >
        {renderFacilityTable()}
      </StakeholderPanel>
    </>
  );

  // -------------------------------------
  // REPORTS
  // -------------------------------------

  const renderReports = () => {
    const reports = [
      {
        title: "Energy Consumption Report",
        description:
          "Review monthly facility electricity consumption.",
        icon: Zap,
        page: "Energy Monitoring",
      },
      {
        title: "Electricity Cost Report",
        description:
          "Review facility electricity expenditure.",
        icon: Wallet,
        page: "Cost Monitoring",
      },
      {
        title: "EPI Performance Report",
        description:
          "Review energy performance index comparisons.",
        icon: Gauge,
        page: "EPI Performance",
      },
      {
        title: "Facility Comparison Report",
        description:
          "Compare energy and cost performance between facilities.",
        icon: Building2,
        page: "Facility Comparison",
      },
    ];

    return (
      <>
        <StakeholderPageHeading
          eyebrow="PERFORMANCE REPORTING"
          title="Reports"
          description="Access available facility monitoring summaries."
        />

        <div className="stakeholder-info-banner">
          <Eye size={19} />

          <span>
            Stakeholders can view monitoring information.
            Report generation and PDF downloads will be
            connected in a later development stage.
          </span>
        </div>

        <div className="stakeholder-report-grid">
          {reports.map((report) => {
            const Icon = report.icon;

            return (
              <article
                className="stakeholder-report-card"
                key={report.title}
              >
                <span className="stakeholder-report-icon">
                  <Icon size={23} />
                </span>

                <h3>{report.title}</h3>

                <p>{report.description}</p>

                <button
                  type="button"
                  className="stakeholder-report-button"
                  onClick={() => handleNavigation(report.page)}
                >
                  View Report
                  <ChevronRight size={16} />
                </button>
              </article>
            );
          })}
        </div>
      </>
    );
  };

  // -------------------------------------
  // SHARED ACCOUNT PROFILE
  // -------------------------------------

  const renderProfile = () => (
    <ProfilePage
      user={user}
      onBack={() => setActivePage("Overview")}
      onSavePhoto={onSavePhoto}
    />
  );

  // -------------------------------------
  // PAGE ROUTING
  // -------------------------------------

  const pageContent = {
    Overview: renderOverview,
    "Energy Monitoring": renderEnergy,
    "Cost Monitoring": renderCosts,
    "EPI Performance": renderEPI,
    "Facility Comparison": renderComparison,
    Reports: renderReports,
    "My Profile": renderProfile,
  };

  // -------------------------------------
  // MAIN RENDER
  // -------------------------------------

  return (
    <div className="stakeholder-layout">

      {mobileMenuOpen && (
        <button
          type="button"
          className="stakeholder-mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`stakeholder-sidebar ${
          mobileMenuOpen ? "open" : ""
        }`}
      >
        <div className="stakeholder-brand">
          <span className="stakeholder-brand-icon">
            <Zap size={23} fill="currentColor" />
          </span>

          <div>
            <strong>EnergyLens</strong>
            <span>MONITORING PLATFORM</span>
          </div>

          <button
            type="button"
            className="stakeholder-mobile-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="stakeholder-role-label">
          STAKEHOLDER WORKSPACE
        </div>

        <nav className="stakeholder-navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activePage === item.label;

            return (
              <button
                key={item.label}
                type="button"
                className={`stakeholder-nav-item ${
                  active ? "active" : ""
                }`}
                onClick={() => handleNavigation(item.label)}
              >
                <Icon size={19} />
                <span>{item.label}</span>

                {active && (
                  <span className="stakeholder-nav-indicator" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="stakeholder-sidebar-bottom">
          <div className="stakeholder-user-card">
            <span className="stakeholder-avatar">
              {displayName.charAt(0).toUpperCase()}
            </span>

            <div>
              <strong>{displayName}</strong>
              <span>Stakeholder</span>
            </div>
          </div>

          <button
            type="button"
            className="stakeholder-logout-button"
            onClick={onLogout}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}

      <main className="stakeholder-main">
        <header className="stakeholder-topbar">
          <div className="stakeholder-topbar-left">
            <button
              type="button"
              className="stakeholder-menu-toggle"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={21} />
            </button>

            <div>
              <span>EnergyLens / Stakeholder</span>
              <strong>{activePage}</strong>
            </div>
          </div>

          <div className="stakeholder-topbar-right">
            <span className="stakeholder-topbar-role">
              <ShieldCheck size={17} />
              Read-only Access
            </span>

            <div style={{ position: "relative" }}>
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={isProfileMenuOpen}
                aria-label="Open profile menu"
                onClick={() => setIsProfileMenuOpen((open) => !open)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "9px",
                  padding: "5px 8px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  background: "#ffffff",
                  color: "inherit",
                  cursor: "pointer",
                }}
              >
                <span className="stakeholder-avatar">
                  {displayName.charAt(0).toUpperCase()}
                </span>
                <span style={{ textAlign: "left", lineHeight: 1.25 }}>
                  <strong style={{ display: "block", fontSize: "13px" }}>
                    {displayName}
                  </strong>
                  <small style={{ display: "block", opacity: 0.7 }}>
                    Stakeholder
                  </small>
                </span>
                <ChevronDown size={15} />
              </button>

              {isProfileMenuOpen && (
                <div
                  role="menu"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    zIndex: 1000,
                    minWidth: "190px",
                    padding: "6px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    background: "#ffffff",
                    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.14)",
                  }}
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleNavigation("My Profile")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      width: "100%",
                      padding: "10px 12px",
                      border: 0,
                      borderRadius: "8px",
                      background: "transparent",
                      color: "#1f2937",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <UserRound size={17} />
                    My Profile
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onLogout?.();
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      width: "100%",
                      padding: "10px 12px",
                      border: 0,
                      borderRadius: "8px",
                      background: "transparent",
                      color: "#b42318",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <LogOut size={17} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {activePage !== "My Profile" && (
        <div className="stakeholder-filter-bar">
          <label htmlFor="stakeholder-facility">
            <MapPin size={16} />
            Facility:
          </label>

          <select
            id="stakeholder-facility"
            value={selectedFacility}
            onChange={(event) =>
              setSelectedFacility(event.target.value)
            }
          >
            <option value="All Facilities">
              All Facilities
            </option>

            {FACILITIES.map((facility) => (
              <option key={facility.id} value={facility.id}>
                {facility.name}
              </option>
            ))}
          </select>
        </div>
        )}

        <div className="stakeholder-page-content">
          {pageContent[activePage]()}
        </div>

        <footer className="stakeholder-footer">
          EnergyLens Management System
          <span>
            Stakeholder Workspace · Read-only · Preview Version
          </span>
        </footer>
      </main>
    </div>
  );
}
