
import { useRef, useState } from "react";

import {
  ChartNoAxesCombined,
  House,
  Settings,
  FileText,
  LogOut,
  Bell,
  UserRound,
  ScanLine,
  CloudUpload,
  FileUp,
  Zap,
  Coins,
  Leaf,
  CalendarDays,
  Layers,
  Database,
  Activity,
  ChevronDown,
  CheckCircle2,
  ArrowLeft,
  Save,
  ClipboardList,
  X,
  Building2,
} from "lucide-react";

import "./App.css";

// ========================================
// SIDEBAR NAVIGATION
// ========================================

const navigationItems = [
  { label: "Home", icon: House },
  { label: "Settings", icon: Settings },
  { label: "Reports", icon: FileText },
  { label: "Logout", icon: LogOut },
];

// ========================================
// DASHBOARD FEATURE ITEMS
// ========================================

const manualEntryItems = [
  { title: "Energy Data Entry", icon: Zap, color: "blue" },
  { title: "Cost Data Entry", icon: Coins, color: "green" },
  { title: "Operational Data Entry", icon: Leaf, color: "purple" },
  { title: "Environmental Data Entry", icon: CalendarDays, color: "orange" },
  { title: "Equipment Registration", icon: Layers, color: "blue" },
];

const recordsItems = [
  { title: "Energy Records", icon: Zap, color: "blue" },
  { title: "Cost Records", icon: Database, color: "green" },
  { title: "Operational Records", icon: Settings, color: "purple" },
  { title: "Equipment Records", icon: FileText, color: "purple" },
  { title: "Environmental Records", icon: Leaf, color: "blue" },
];

// ========================================
// ENTRY FORM CONFIGURATIONS
// All fields are optional.
// Preliminary structure only.
// ========================================

const entryPages = {
  "Energy Data Entry": {
    title: "Energy Data Entry",
    description: "Record energy consumption and meter information.",
    icon: Zap,
    sections: [
      {
        title: "General Information",
        fields: [
          {
            name: "facility",
            label: "Facility Name",
            placeholder: "Enter facility name",
          },
          {
            name: "record_date",
            label: "Record Date",
            type: "date",
          },
          {
            name: "meter_number",
            label: "Meter Number",
            placeholder: "Enter meter number",
          },
          {
            name: "energy_source",
            label: "Energy Source",
            type: "select",
            options: [
              "Electricity",
              "Diesel",
              "Natural Gas",
              "LPG",
              "Solar",
              "Other",
            ],
          },
          {
            name: "meter_type",
            label: "Meter Type",
            type: "select",
            options: [
              "Main Meter",
              "Sub Meter",
              "Other",
            ],
          },
        ],
      },
      {
        title: "Energy Consumption",
        fields: [
          {
            name: "consumption",
            label: "Total Consumption",
            type: "number",
            placeholder: "Enter consumption",
          },
          {
            name: "consumption_unit",
            label: "Consumption Unit",
            type: "select",
            options: ["kWh", "MWh", "Litre", "m³", "Other"],
          },
          {
            name: "peak_consumption",
            label: "Peak Consumption",
            type: "number",
            placeholder: "Enter peak consumption",
          },
          {
            name: "off_peak_consumption",
            label: "Off-Peak Consumption",
            type: "number",
            placeholder: "Enter off-peak consumption",
          },
          {
            name: "demand",
            label: "Maximum Demand",
            type: "number",
            placeholder: "Enter maximum demand",
          },
          {
            name: "demand_unit",
            label: "Demand Unit",
            type: "select",
            options: ["kW", "kVA", "Other"],
          },
        ],
      },
      {
        title: "Additional Information",
        fields: [
          {
            name: "remarks",
            label: "Remarks",
            type: "textarea",
            placeholder: "Enter additional information...",
            fullWidth: true,
          },
        ],
      },
    ],
  },

const recordPageConfigs = {
  "Energy Records": {
    title: "Energy Records",
    entryTitle: "Energy Data Entry",
    description: "View energy consumption records.",
    columns: [
      { key: "facility", label: "Facility" },
      { key: "record_date", label: "Record Date" },
      { key: "meter_number", label: "Meter Number" },
      { key: "energy_source", label: "Energy Source" },
      { key: "consumption", label: "Consumption" },
      { key: "consumption_unit", label: "Unit" },
      { key: "savedAt", label: "Saved At" },
    ],
  },

  "Cost Records": {
    title: "Cost Records",
    entryTitle: "Cost Data Entry",
    description: "View utility expenses and billing records.",
    columns: [
      { key: "facility", label: "Facility" },
      { key: "billing_start", label: "Billing Start" },
      { key: "billing_end", label: "Billing End" },
      { key: "cost_category", label: "Category" },
      { key: "invoice_reference", label: "Invoice Reference" },
      { key: "amount", label: "Amount" },
      { key: "total_amount", label: "Total Amount" },
      { key: "savedAt", label: "Saved At" },
    ],
  },

  "Operational Records": {
    title: "Operational Records",
    entryTitle: "Operational Data Entry",
    description: "View operational measurements and activities.",
    columns: [
      { key: "facility", label: "Facility" },
      { key: "record_date", label: "Date" },
      { key: "department", label: "Department" },
      { key: "activity", label: "Activity" },
      { key: "metric_name", label: "Metric" },
      { key: "metric_value", label: "Value" },
      { key: "unit", label: "Unit" },
      { key: "savedAt", label: "Saved At" },
    ],
  },

  "Equipment Records": {
    title: "Equipment Records",
    entryTitle: "Equipment Registration",
    description: "View registered equipment and asset information.",
    columns: [
      { key: "equipment_name", label: "Equipment Name" },
      { key: "equipment_id", label: "Equipment ID" },
      { key: "equipment_type", label: "Type" },
      { key: "facility", label: "Facility" },
      { key: "location", label: "Location" },
      { key: "manufacturer", label: "Manufacturer" },
      { key: "operating_status", label: "Status" },
      { key: "savedAt", label: "Saved At" },
    ],
  },

  "Environmental Records": {
    title: "Environmental Records",
    entryTitle: "Environmental Data Entry",
    description: "View environmental measurements and indicators.",
    columns: [
      { key: "facility", label: "Facility" },
      { key: "record_date", label: "Date" },
      { key: "indicator", label: "Indicator" },
      { key: "emission_scope", label: "Emission Scope" },
      { key: "measured_value", label: "Measured Value" },
      { key: "unit", label: "Unit" },
      { key: "emission_factor", label: "Emission Factor" },
      { key: "savedAt", label: "Saved At" },
    ],
  },
};

  "Cost Data Entry": {
    title: "Cost Data Entry",
    description: "Record utility expenses, billing and cost information.",
    icon: Coins,
    sections: [
      {
        title: "Billing Information",
        fields: [
          {
            name: "facility",
            label: "Facility Name",
            placeholder: "Enter facility name",
          },
          {
            name: "billing_start",
            label: "Billing Period Start",
            type: "date",
          },
          {
            name: "billing_end",
            label: "Billing Period End",
            type: "date",
          },
          {
            name: "cost_category",
            label: "Cost Category",
            type: "select",
            options: [
              "Electricity",
              "Fuel",
              "Water",
              "Maintenance",
              "Other",
            ],
          },
          {
            name: "invoice_reference",
            label: "Invoice / Reference Number",
            placeholder: "Enter reference number",
          },
        ],
      },
      {
        title: "Financial Information",
        fields: [
          {
            name: "amount",
            label: "Amount",
            type: "number",
            placeholder: "Enter amount",
          },
          {
            name: "currency",
            label: "Currency",
            type: "select",
            options: ["MYR (RM)", "USD", "Other"],
          },
          {
            name: "tax_amount",
            label: "Tax Amount",
            type: "number",
            placeholder: "Enter tax amount",
          },
          {
            name: "total_amount",
            label: "Total Amount",
            type: "number",
            placeholder: "Enter total amount",
          },
        ],
      },
      {
        title: "Additional Information",
        fields: [
          {
            name: "remarks",
            label: "Remarks",
            type: "textarea",
            placeholder: "Enter additional information...",
            fullWidth: true,
          },
        ],
      },
    ],
  },

  "Operational Data Entry": {
    title: "Operational Data Entry",
    description: "Record operational activities and performance measurements.",
    icon: Activity,
    sections: [
      {
        title: "General Information",
        fields: [
          {
            name: "facility",
            label: "Facility Name",
            placeholder: "Enter facility name",
          },
          {
            name: "record_date",
            label: "Reporting Date",
            type: "date",
          },
          {
            name: "department",
            label: "Department / Area",
            placeholder: "Enter department or area",
          },
          {
            name: "activity",
            label: "Process / Activity",
            placeholder: "Enter process or activity",
          },
        ],
      },
      {
        title: "Operational Measurements",
        fields: [
          {
            name: "metric_name",
            label: "Measurement / Metric Name",
            placeholder: "Enter metric name",
          },
          {
            name: "metric_value",
            label: "Measured Value",
            type: "number",
            placeholder: "Enter measured value",
          },
          {
            name: "unit",
            label: "Unit",
            placeholder: "Enter measurement unit",
          },
          {
            name: "reporting_period",
            label: "Reporting Period",
            placeholder: "e.g. Monthly, Quarterly",
          },
        ],
      },
      {
        title: "Additional Information",
        fields: [
          {
            name: "remarks",
            label: "Remarks",
            type: "textarea",
            placeholder: "Enter operational notes...",
            fullWidth: true,
          },
        ],
      },
    ],
  },

  "Environmental Data Entry": {
    title: "Environmental Data Entry",
    description: "Record environmental indicators and measurements.",
    icon: Leaf,
    sections: [
      {
        title: "General Information",
        fields: [
          {
            name: "facility",
            label: "Facility Name",
            placeholder: "Enter facility name",
          },
          {
            name: "record_date",
            label: "Reporting Date",
            type: "date",
          },
          {
            name: "indicator",
            label: "Environmental Indicator",
            type: "select",
            options: [
              "Greenhouse Gas Emissions",
              "Water Consumption",
              "Waste Generated",
              "Waste Recycled",
              "Air Emissions",
              "Other",
            ],
          },
          {
            name: "emission_scope",
            label: "Emission Scope (If Applicable)",
            type: "select",
            options: [
              "Not Applicable",
              "Scope 1",
              "Scope 2",
              "Scope 3",
            ],
          },
        ],
      },
      {
        title: "Environmental Measurements",
        fields: [
          {
            name: "measured_value",
            label: "Measured Value",
            type: "number",
            placeholder: "Enter measured value",
          },
          {
            name: "unit",
            label: "Measurement Unit",
            placeholder: "e.g. kgCO2e, m³, tonnes",
          },
          {
            name: "emission_factor",
            label: "Emission Factor (If Applicable)",
            type: "number",
            placeholder: "Enter emission factor",
          },
          {
            name: "reporting_period",
            label: "Reporting Period",
            placeholder: "e.g. Monthly, Annually",
          },
        ],
      },
      {
        title: "Additional Information",
        fields: [
          {
            name: "remarks",
            label: "Remarks",
            type: "textarea",
            placeholder: "Enter environmental notes...",
            fullWidth: true,
          },
        ],
      },
    ],
  },

  "Equipment Registration": {
    title: "Equipment Registration",
    description: "Register equipment and record basic asset information.",
    icon: Layers,
    sections: [
      {
        title: "Equipment Information",
        fields: [
          {
            name: "equipment_name",
            label: "Equipment Name",
            placeholder: "Enter equipment name",
          },
          {
            name: "equipment_id",
            label: "Equipment ID",
            placeholder: "Enter equipment ID",
          },
          {
            name: "equipment_type",
            label: "Equipment Type",
            type: "select",
            options: [
              "HVAC",
              "Boiler",
              "Chiller",
              "Pump",
              "Motor",
              "Lighting",
              "Other",
            ],
          },
          {
            name: "facility",
            label: "Facility Name",
            placeholder: "Enter facility name",
          },
          {
            name: "location",
            label: "Installation Location",
            placeholder: "Enter location",
          },
          {
            name: "department",
            label: "Department",
            placeholder: "Enter department",
          },
        ],
      },
      {
        title: "Technical Information",
        fields: [
          {
            name: "manufacturer",
            label: "Manufacturer",
            placeholder: "Enter manufacturer",
          },
          {
            name: "model",
            label: "Model Number",
            placeholder: "Enter model number",
          },
          {
            name: "rated_capacity",
            label: "Rated Capacity",
            type: "number",
            placeholder: "Enter rated capacity",
          },
          {
            name: "capacity_unit",
            label: "Capacity Unit",
            type: "select",
            options: ["kW", "kVA", "HP", "RT", "Other"],
          },
          {
            name: "installation_date",
            label: "Installation Date",
            type: "date",
          },
          {
            name: "operating_status",
            label: "Operating Status",
            type: "select",
            options: [
              "Operational",
              "Under Maintenance",
              "Decommissioned",
              "Other",
            ],
          },
        ],
      },
      {
        title: "Additional Information",
        fields: [
          {
            name: "remarks",
            label: "Remarks",
            type: "textarea",
            placeholder: "Enter equipment notes...",
            fullWidth: true,
          },
        ],
      },
    ],
  },
};

// ========================================
// REUSABLE FEATURE CARD
// ========================================

function FeatureCard({ item, onClick }) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      className="feature-card"
      onClick={() => onClick(item.title)}
    >
      <span className={`feature-icon ${item.color}`}>
        <Icon size={23} strokeWidth={2} />
      </span>

      <span className="feature-title">
        {item.title}
      </span>

      <span className="available-badge">
        <span className="available-dot" />
        Available
      </span>
    </button>
  );
}

// ========================================
// PANEL HEADER
// ========================================

function PanelHeader({ icon: Icon, title }) {
  return (
    <div className="panel-header">
      <span className="panel-heading-icon">
        <Icon size={25} strokeWidth={2.2} />
      </span>

      <h2>{title}</h2>
    </div>
  );
}

// ========================================
// SIDEBAR
// ========================================

function Sidebar({ activeNav, onNavigate }) {
  return (
    <aside className="sidebar">

      <div className="brand">
        <ChartNoAxesCombined size={31} strokeWidth={2.2} />
        <span>EnergyLens</span>
      </div>

      <nav className="sidebar-nav">

        {navigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              type="button"
              key={item.label}
              className={`nav-item ${
                activeNav === item.label ? "active" : ""
              }`}
              onClick={() => onNavigate(item.label)}
            >
              <Icon size={21} strokeWidth={2} />
              <span>{item.label}</span>
            </button>
          );
        })}

      </nav>

      <div className="sidebar-decoration" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>

    </aside>
  );
}

// ========================================
// REUSABLE ENTRY FORM FIELD
// ========================================

function EntryField({ field, value, onChange }) {
  const id = `entry-${field.name}`;

  return (
    <div
      className={`entry-field ${
        field.fullWidth ? "full-width" : ""
      }`}
    >

      <label htmlFor={id}>
        {field.label}

        <span className="field-optional">
          Optional
        </span>
      </label>

      {field.type === "select" ? (

        <select
          id={id}
          name={field.name}
          value={value}
          onChange={(event) => onChange(field.name, event.target.value)}
        >
          <option value="">Select {field.label}</option>

          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}

        </select>

      ) : field.type === "textarea" ? (

        <textarea
          id={id}
          name={field.name}
          rows={4}
          value={value}
          placeholder={field.placeholder || "Enter information"}
          onChange={(event) => onChange(field.name, event.target.value)}
        />

      ) : (

        <input
          id={id}
          name={field.name}
          type={field.type || "text"}
          step={field.type === "number" ? "any" : undefined}
          value={value}
          placeholder={field.placeholder || "Enter information"}
          onChange={(event) => onChange(field.name, event.target.value)}
        />

      )}

    </div>
  );
}

// ========================================
// FIVE ENTRY PAGES
// ========================================

function EntryPage({
  config,
  onBack,
  onSave,
  savedCount,
}) {
  const Icon = config.icon;

  const [formData, setFormData] = useState({});

  const handleChange = (name, value) => {
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    onSave(config.title, formData);

    setFormData({});
  };

  return (
    <section className="entry-page">

      {/* PAGE HEADER */}

      <div className="entry-page-top">

        <button
          type="button"
          className="back-home-button"
          onClick={onBack}
        >
          <ArrowLeft size={17} />
          Back to Dashboard
        </button>

        <div className="entry-count">
          <ClipboardList size={17} />
          <span>{savedCount} saved this session</span>
        </div>

      </div>

      {/* TITLE */}

      <div className="entry-page-heading">

        <div className="entry-title-icon">
          <Icon size={27} />
        </div>

        <div>
          <span className="entry-eyebrow">
            STAFF WORKSPACE / MANUAL DATA ENTRY
          </span>

          <h1>{config.title}</h1>

          <p>{config.description}</p>
        </div>

      </div>

      {/* OPTIONAL FIELD NOTICE */}

      <div className="entry-info-note">
        <CheckCircle2 size={18} />

        <span>
          All fields are optional. Enter the information
          currently available to you.
        </span>
      </div>

      {/* ENTRY FORM */}

      <form
        className="entry-form-card"
        onSubmit={handleSubmit}
      >

        {config.sections.map((section, index) => (

          <section
            className="entry-section"
            key={section.title}
          >

            <div className="entry-section-heading">

              <span className="section-number">
                {String(index + 1).padStart(2, "0")}
              </span>

              <h2>{section.title}</h2>

            </div>

            <div className="entry-fields-grid">

              {section.fields.map((field) => (

                <EntryField
                  key={field.name}
                  field={field}
                  value={formData[field.name] ?? ""}
                  onChange={handleChange}
                />

              ))}

            </div>

          </section>

        ))}

        {/* FORM FOOTER */}

        <div className="entry-form-footer">

          <span>
            <Building2 size={16} />
            EnergyLens Staff Entry
          </span>

          <div className="entry-form-actions">

            <button
              type="button"
              className="entry-cancel-button"
              onClick={() => {
                setFormData({});
                onBack();
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="entry-save-button"
            >
              <Save size={17} />
              Save Entry
            </button>

          </div>

        </div>

      </form>

      <p className="entry-disclaimer">
        Preliminary form structure. Field names and requirements
        will be reviewed after supervisor confirmation.
      </p>

    </section>
  );
}

// ========================================
// PLACEHOLDER FOR OTHER PAGES
// ========================================

function PlaceholderPage({ title, onBack }) {
  return (
    <section className="placeholder-page">

      <button
        type="button"
        className="back-home-button"
        onClick={onBack}
      >
        <ArrowLeft size={17} />
        Back to Dashboard
      </button>

      <div className="placeholder-heading">
        <span>STAFF WORKSPACE</span>

        <h1>{title}</h1>

        <p>
          Manage your {title.toLowerCase()} information
          in EnergyLens.
        </p>
      </div>

      <div className="placeholder-card">

        <div className="placeholder-icon">
          <Database size={34} />
        </div>

        <h2>{title}</h2>

        <p>
          This page is being developed. The interface
          and functionality will be added in the next
          development stage.
        </p>

        <span className="development-status">
          <span />
          Under Development
        </span>

      </div>

    </section>
  );
}

// ========================================
// MAIN APPLICATION
// ========================================

function App() {

  const fileInputRef = useRef(null);

  const [activeNav, setActiveNav] = useState("Home");
  const [activePage, setActivePage] = useState("Home");

  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const [notice, setNotice] = useState("");

  // Temporary frontend records.
  // These are NOT saved to Firebase yet.

  const [savedRecords, setSavedRecords] = useState({});

  // ========================================
  // FILE UPLOAD
  // ========================================

  const selectFile = (file) => {
    if (!file) return;

    const allowedFile = /\.(pdf|jpg|jpeg|png)$/i.test(file.name);

    if (!allowedFile) {
      setNotice("Please select a PDF, JPG, JPEG or PNG file.");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setNotice("File size must not exceed 20 MB.");
      return;
    }

    setSelectedFile(file);
    setNotice("");
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (file) {
      selectFile(file);
    }

    event.target.value = "";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      selectFile(file);
    }
  };

  // ========================================
  // FEATURE NAVIGATION
  // ========================================

  const handleFeatureClick = (feature) => {
    setActivePage(feature);
    setActiveNav("Home");
    setNotice("");
  };

  const handleNavigation = (page) => {

    if (page === "Logout") {
      setNotice(
        "Logout will be connected to Firebase Authentication."
      );
      return;
    }

    setActiveNav(page);
    setActivePage(page);
    setNotice("");
  };

  const handleBackHome = () => {
    setActivePage("Home");
    setActiveNav("Home");
    setNotice("");
  };

  // ========================================
  // SAVE ENTRY - TEMPORARY
  // ========================================

  const handleSaveEntry = (title, values) => {

    const newRecord = {
      id: Date.now(),
      ...values,
      savedAt: new Date().toLocaleString(),
    };

    setSavedRecords((current) => ({
      ...current,
      [title]: [
        ...(current[title] || []),
        newRecord,
      ],
    }));

    setNotice(
      `${title} saved in this demo session. Firebase is not connected yet.`
    );
  };

  // ========================================
  // DOCUMENT EXTRACTION PLACEHOLDER
  // ========================================

  const handleExtract = () => {
    if (!selectedFile) {
      setNotice("Please upload a document before extracting.");
      return;
    }

    setNotice(
      `${selectedFile.name} is ready. OCR integration will be connected later.`
    );
  };

  // ========================================
  // RENDER
  // ========================================

  const currentEntryConfig = entryPages[activePage];

  return (

    <div className="app-shell">

      {/* SIDEBAR */}

      <Sidebar
        activeNav={activeNav}
        onNavigate={handleNavigation}
      />

      <main className="main-content">

        {/* HEADER */}

        <header className="top-header">

          <div className="welcome-section">
            <h1>Welcome, test_staff!</h1>
            <p>Your workspace is ready.</p>
          </div>

          <div className="header-actions">

            <button
              type="button"
              className="notification-button"
              aria-label="Notifications"
              onClick={() => setNotice("No new notifications.")}
            >
              <Bell size={22} />
              <span className="notification-dot" />
            </button>

            <button
              type="button"
              className="profile-button"
              onClick={() => setNotice("Staff profile selected.")}
            >
              <span className="profile-avatar">
                <UserRound size={19} />
              </span>

              <span>Staff</span>

              <ChevronDown size={16} />
            </button>

          </div>

        </header>

        {/* HOME DASHBOARD */}

        {activePage === "Home" ? (

          <section className="dashboard-grid">

            {/* SMART DOCUMENT IMPORT */}

            <article className="dashboard-panel">

              <PanelHeader
                icon={ScanLine}
                title="Smart Document Import"
              />

              <div className="panel-body">

                <div
                  className={`upload-zone ${
                    isDragging ? "dragging" : ""
                  }`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                >

                  <CloudUpload
                    className="upload-main-icon"
                    size={51}
                    strokeWidth={1.8}
                  />

                  <h3>Drag & Drop Files</h3>

                  <div className="upload-or">
                    <span />
                    or
                    <span />
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    hidden
                    onChange={handleFileChange}
                  />

                  <button
                    type="button"
                    className="browse-button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileUp size={19} />
                    Browse Files
                  </button>

                  <p className="upload-hint">
                    PDF, JPG, JPEG and PNG · Maximum 20 MB
                  </p>

                  {selectedFile && (

                    <div className="selected-file">

                      <FileText size={17} />

                      <span title={selectedFile.name}>
                        {selectedFile.name}
                      </span>

                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        aria-label="Remove selected file"
                      >
                        <X size={16} />
                      </button>

                    </div>

                  )}

                </div>

                {selectedFile && (

                  <button
                    type="button"
                    className="extract-button"
                    onClick={handleExtract}
                  >
                    Extract Document
                  </button>

                )}

              </div>

            </article>

            {/* MANUAL DATA ENTRY */}

            <article className="dashboard-panel">

              <PanelHeader
                icon={Activity}
                title="Manual Data Entry"
              />

              <div className="panel-body">

                <div className="feature-grid">

                  {manualEntryItems.map((item) => (

                    <FeatureCard
                      key={item.title}
                      item={item}
                      onClick={handleFeatureClick}
                    />

                  ))}

                </div>

              </div>

            </article>

            {/* DATA RECORDS */}

            <article className="dashboard-panel">

              <PanelHeader
                icon={Database}
                title="Data Records"
              />

              <div className="panel-body">

                <div className="feature-grid">

                  {recordsItems.map((item) => (

                    <FeatureCard
                      key={item.title}
                      item={item}
                      onClick={handleFeatureClick}
                    />

                  ))}

                </div>

              </div>

            </article>

          </section>

        ) : currentEntryConfig ? (

          /* FIVE ENTRY FORMS */

          <EntryPage
            key={activePage}
            config={currentEntryConfig}
            onBack={handleBackHome}
            onSave={handleSaveEntry}
            savedCount={
              (savedRecords[activePage] || []).length
            }
          />

        ) : (

          /* OTHER PAGES */

          <PlaceholderPage
            title={activePage}
            onBack={handleBackHome}
          />

        )}

        {/* NOTIFICATION */}

        {notice && (

          <div className="notice-message" role="status">

            <CheckCircle2 size={17} />

            <span>{notice}</span>

            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss message"
            >
              <X size={16} />
            </button>

          </div>

        )}

      </main>

    </div>
  );
}

export default App;
