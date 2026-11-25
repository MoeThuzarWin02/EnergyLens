import { useCallback, useEffect, useRef, useState } from "react";

import { BrowserMultiFormatReader } from "@zxing/browser";

import ManagerDashboard from "./ManagerDashboard";

import LoginPage from "./LoginPage";

import AnalystDashboard from "./AnalystDashboard";

import StakeholderDashboard from "./StakeholderDashboard";
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

    barcodeField: "meter_number",

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

  "Cost Data Entry": {

    title: "Cost Data Entry",

    description: "Record utility expenses, billing and cost information.",

    barcodeField: "invoice_reference",

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

    barcodeField: "reference_code",

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

          {

            name: "reference_code",

            label: "Asset / Reference ID",

            placeholder: "Optional barcode or reference ID",

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

    barcodeField: "reference_code",

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

          {

            name: "reference_code",

            label: "Sample / Reference ID",

            placeholder: "Optional barcode or sample reference",

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

    barcodeField: "equipment_id",

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

      { key: "reference_code", label: "Reference ID" },

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

      { key: "reference_code", label: "Sample / Reference ID" },

      { key: "measured_value", label: "Measured Value" },

      { key: "unit", label: "Unit" },

      { key: "emission_factor", label: "Emission Factor" },

      { key: "savedAt", label: "Saved At" },

    ],

  },

};

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

// ========================================

// BARCODE / QR CODE SCANNER

// ========================================

function BarcodeScanner({ onDetected, onClose }) {

  const videoRef = useRef(null);

  const [cameraError, setCameraError] = useState("");

  useEffect(() => {

    let active = true;

    let controls = null;

    const reader = new BrowserMultiFormatReader();

    reader

      .decodeFromVideoDevice(

        undefined,

        videoRef.current,

        (result, _error, callbackControls) => {

          if (callbackControls) {

            controls = callbackControls;

          }

          if (result && active) {

            active = false;

            controls?.stop();

            onDetected(result.getText());

          }

        }

      )

      .then((startedControls) => {

        controls = startedControls;

        if (!active) {

          startedControls.stop();

        }

      })

      .catch((error) => {

        if (!active) return;

        if (error?.name === "NotAllowedError") {

          setCameraError(

            "Camera permission was denied. Allow camera access in your browser settings and try again."

          );

        } else {

          setCameraError(

            "Unable to start the camera. Check that a camera is connected and that this page is using localhost or HTTPS."

          );

        }

      });

    return () => {

      active = false;

      controls?.stop();

    };

  }, [onDetected]);

  return (

    <div

      className="barcode-modal-backdrop"

      role="presentation"

      onMouseDown={(event) => {

        if (event.target === event.currentTarget) {

          onClose();

        }

      }}

    >

      <section

        className="barcode-modal"

        role="dialog"

        aria-modal="true"

        aria-labelledby="barcode-modal-title"

      >

        <div className="barcode-modal-header">

          <div>

            <span className="entry-eyebrow">ENERGYLENS SCANNER</span>

            <h2 id="barcode-modal-title">Scan barcode or QR code</h2>

            <p>Position the code inside the camera frame.</p>

          </div>

          <button

            type="button"

            className="barcode-modal-close"

            onClick={onClose}

            aria-label="Close scanner"

          >

            <X size={20} />

          </button>

        </div>

        <div className="barcode-video-frame">

          <video

            ref={videoRef}

            className="barcode-video"

            autoPlay

            muted

            playsInline

          />

          <span className="barcode-scan-guide" aria-hidden="true" />

        </div>

        {cameraError ? (

          <p className="barcode-camera-error" role="alert">

            {cameraError}

          </p>

        ) : (

          <p className="barcode-camera-hint">

            Keep the barcode or QR code steady and clearly visible.

          </p>

        )}

        <div className="barcode-modal-actions">

          <button

            type="button"

            className="entry-cancel-button"

            onClick={onClose}

          >

            Cancel

          </button>

        </div>

      </section>

    </div>

  );

}

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

  const [scannerOpen, setScannerOpen] = useState(false);

  const [scanMessage, setScanMessage] = useState("");

  const barcodeTargetLabel =

    config.sections

      .flatMap((section) => section.fields)

      .find((field) => field.name === config.barcodeField)?.label ||

    "reference field";

  const handleBarcodeDetected = useCallback(

    (scannedValue) => {

      setFormData((current) => ({

        ...current,

        [config.barcodeField]: scannedValue,

      }));

      setScanMessage(`Scanned value added to ${barcodeTargetLabel}.`);

      setScannerOpen(false);

    },

    [config.barcodeField, barcodeTargetLabel]

  );

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

        <div className="entry-barcode-toolbar">

          <div className="entry-barcode-copy">

            <span className="entry-barcode-kicker">OPTIONAL QUICK INPUT</span>

            <strong>Barcode / QR code scanning</strong>

            <p>

              Scan to fill <b>{barcodeTargetLabel}</b>. You can also enter

              this information manually.

            </p>

          </div>

          <button

            type="button"

            className="entry-barcode-button"

            onClick={() => {

              setScanMessage("");

              setScannerOpen(true);

            }}

          >

            <ScanLine size={18} />

            Scan Barcode

          </button>

        </div>

        {scanMessage && (

          <p className="barcode-success-message" role="status">

            <CheckCircle2 size={16} />

            {scanMessage}

          </p>

        )}

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

      {scannerOpen && (

        <BarcodeScanner

          onDetected={handleBarcodeDetected}

          onClose={() => setScannerOpen(false)}

        />

      )}

      <p className="entry-disclaimer">

        Preliminary form structure. Field names and requirements

        will be reviewed after supervisor confirmation.

      </p>

    </section>

  );

}

// ========================================

// ========================================

// DATA RECORDS PAGE

// ========================================

function RecordPage({ config, records, onBack }) {

  const [searchTerm, setSearchTerm] = useState("");

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredRecords = records.filter((record) => {

    if (!normalizedSearch) return true;

    return config.columns.some((column) =>

      String(record[column.key] ?? "")

        .toLowerCase()

        .includes(normalizedSearch)

    );

  });

  return (

    <section className="entry-page record-page">

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

          <span>{records.length} saved records</span>

        </div>

      </div>

      <div className="entry-page-heading">

        <div className="entry-title-icon">

          <Database size={27} />

        </div>

        <div>

          <span className="entry-eyebrow">

            STAFF WORKSPACE / DATA RECORDS

          </span>

          <h1>{config.title}</h1>

          <p>{config.description}</p>

        </div>

      </div>

      <div className="entry-info-note">

        <CheckCircle2 size={18} />

        <span>

          These records are temporary and will remain available only during

          this browser session until Firebase is connected.

        </span>

      </div>

      <div className="record-list-card">

        <div className="record-list-toolbar">

          <div>

            <h2>{config.title}</h2>

            <p>Review the information submitted through the data entry form.</p>

          </div>

          <input

            className="record-search-input"

            type="search"

            value={searchTerm}

            onChange={(event) => setSearchTerm(event.target.value)}

            placeholder="Search records..."

            aria-label={`Search ${config.title}`}

          />

        </div>

        {filteredRecords.length > 0 ? (

          <div className="record-table-wrap">

            <table className="record-table">

              <thead>

                <tr>

                  <th>No.</th>

                  {config.columns.map((column) => (

                    <th key={column.key}>{column.label}</th>

                  ))}

                </tr>

              </thead>

              <tbody>

                {filteredRecords.map((record, index) => (

                  <tr key={record.id ?? `${config.title}-${index}`}>

                    <td>{index + 1}</td>

                    {config.columns.map((column) => (

                      <td key={column.key}>

                        {record[column.key] === null ||

                        record[column.key] === undefined ||

                        record[column.key] === ""

                          ? "—"

                          : String(record[column.key])}

                      </td>

                    ))}

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        ) : (

          <div className="record-empty-state">

            <Database size={34} />

            <h3>

              {records.length === 0

                ? "No records available yet"

                : "No matching records found"}

            </h3>

            <p>

              {records.length === 0

                ? `Submit a ${config.entryTitle} form to see its saved records here.`

                : "Try another search term."}

            </p>

          </div>

        )}

      </div>

      <p className="entry-disclaimer">

        Demo mode: records are stored in React state only. They are not yet

        saved to Firebase and will be cleared when the page is refreshed.

      </p>

    </section>

  );

}

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


const DEMO_PASSWORD = "EnergyLens123!";

const DEMO_PROFILES = {
  "manager@energylens.demo": {
    uid: "demo-manager-001",
    displayName: "EnergyLens Manager",
    email: "manager@energylens.demo",
    role: "manager",
    active: true,
  },

  "analyst@energylens.demo": {
    uid: "demo-analyst-001",
    displayName: "EnergyLens Analyst",
    email: "analyst@energylens.demo",
    role: "analyst",
    active: true,
  },

  "staff@energylens.demo": {
    uid: "demo-staff-001",
    displayName: "EnergyLens Staff",
    email: "staff@energylens.demo",
    role: "staff",
    active: true,
  },

  "stakeholder@energylens.demo": {
    uid: "demo-stakeholder-001",
    displayName: "EnergyLens Stakeholder",
    email: "stakeholder@energylens.demo",
    role: "stakeholder",
    active: true,
  },
};


function PendingRoleDashboard({ role, onLogout }) {

  const isAnalyst = role === "analyst";

  const title = isAnalyst

    ? "Analyst Workspace"

    : "Stakeholder Workspace";

  const features = isAnalyst

    ? [

        "PCA and TOPSIS analysis",

        "EPI results and energy predictions",

        "Simulation and scenario analysis",

        "OCR extraction review and correction",

      ]

    : [

        "Facility performance statistics",

        "Energy consumption monitoring",

        "Electricity cost monitoring",

        "Monthly charts and reports",

        "EPI performance monitoring",

      ];

  return (

    <main

      style={{

        minHeight: "100vh",

        padding: "45px",

        background: "#f4f7fb",

        color: "#183451",

      }}

    >

      <header

        style={{

          display: "flex",

          justifyContent: "space-between",

          alignItems: "center",

          flexWrap: "wrap",

          gap: "15px",

        }}

      >

        <div>

          <h1 style={{ margin: 0 }}>EnergyLens</h1>

          <p>{title}</p>

        </div>

        <button

          type="button"

          onClick={onLogout}

          style={{

            padding: "11px 20px",

            border: "1px solid #d5deea",

            borderRadius: "8px",

            background: "white",

            cursor: "pointer",

          }}

        >

          <LogOut size={16} style={{ verticalAlign: "middle" }} />

          {" "}Logout

        </button>

      </header>

      <section

        style={{

          maxWidth: "750px",

          margin: "65px auto",

          padding: "35px",

          background: "white",

          borderRadius: "15px",

          boxShadow: "0 5px 25px rgba(20,45,75,0.06)",

        }}

      >

        <span

          style={{

            color: "#3475b6",

            fontWeight: 700,

            fontSize: "12px",

          }}

        >

          {role.toUpperCase()} DASHBOARD

        </span>

        <h2>{title}</h2>

        <p style={{ color: "#718096" }}>

          Your account has been recognised successfully.

          This dashboard is currently under development.

        </p>

        <h3>Planned functions</h3>

        <ul style={{ lineHeight: 2.2, paddingLeft: "22px" }}>

          {features.map((feature) => (

            <li key={feature}>{feature}</li>

          ))}

        </ul>

        <p style={{ color: "#8a96a8", fontSize: "13px" }}>

          These features will be implemented in the next

          development stage.

        </p>

      </section>

    </main>

  );

}

function OCRReviewPanel({
  selectedFile,
  extractedData,
  documents,
  onFieldChange,
  onApprove,
  onReject,
}) {
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(selectedFile);

    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const isPdf =
    selectedFile?.type === "application/pdf" ||
    /\.pdf$/i.test(selectedFile?.name || "");

  const fields = [
    {
      key: "consumptionKwh",
      label: "Energy Consumption (kWh)",
      type: "number",
    },
    {
      key: "electricityCost",
      label: "Electricity Cost (RM)",
      type: "number",
    },
    {
      key: "billingPeriod",
      label: "Billing Period",
      type: "text",
    },
    {
      key: "peakDemandKw",
      label: "Peak Demand (kW)",
      type: "number",
    },
    {
      key: "tariffRate",
      label: "Tariff Rate (RM/kWh)",
      type: "number",
    },
  ];

  return (
    <article className="dashboard-panel ocr-workspace-panel">

      <PanelHeader
        icon={ScanLine}
        title="OCR Document Review"
      />

      <div className="ocr-workspace-content">

        <div className="ocr-review-grid">

          {/* DOCUMENT PREVIEW */}

          <section className="ocr-preview-card">

            <h3>Document Preview</h3>

            <p>
              Preview your selected electricity bill or document.
            </p>

            <div className="ocr-document-preview">

              {!selectedFile ? (
                <div className="ocr-empty-preview">
                  <CloudUpload size={42} />

                  <strong>No document selected</strong>

                  <span>
                    Upload a document using Smart Document Import.
                  </span>
                </div>
              ) : isPdf ? (
                <iframe
                  src={previewUrl}
                  title="PDF document preview"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Uploaded electricity document"
                />
              )}

            </div>

            {selectedFile && (
              <div className="ocr-file-information">

                <FileText size={18} />

                <span>{selectedFile.name}</span>

              </div>
            )}

          </section>

          {/* EXTRACTION RESULTS */}

          <section className="ocr-results-card">

            <h3>Extraction Results</h3>

            <p>
              Review and correct the information extracted
              from your electricity document.
            </p>

            {!extractedData ? (

              <div className="ocr-empty-results">

                <ScanLine size={38} />

                <strong>No extraction results yet</strong>

                <span>
                  Select a document and click Extract Document
                  to generate demonstration results.
                </span>

              </div>

            ) : (

              <>

                <div className="ocr-review-status">

                  <span>Processing Status</span>

                  <strong>{extractedData.status}</strong>

                </div>

                <div className="ocr-fields-grid">

                  {fields.map((field) => (

                    <div
                      className="ocr-field"
                      key={field.key}
                    >

                      <label htmlFor={`ocr-${field.key}`}>
                        {field.label}
                      </label>

                      <input
                        id={`ocr-${field.key}`}
                        type={field.type}
                        step="any"
                        value={extractedData[field.key]}
                        onChange={(event) =>
                          onFieldChange(
                            field.key,
                            event.target.value
                          )
                        }
                        disabled={
                          extractedData.status !== "Pending Review"
                        }
                      />

                    </div>

                  ))}

                </div>

                {extractedData.status === "Pending Review" && (

                  <div className="ocr-review-actions">

                    <button
                      type="button"
                      className="ocr-approve-button"
                      onClick={onApprove}
                    >
                      <CheckCircle2 size={17} />
                      Approve Document
                    </button>

                    <button
                      type="button"
                      className="ocr-reject-button"
                      onClick={onReject}
                    >
                      <X size={17} />
                      Reject Document
                    </button>

                  </div>

                )}

              </>

            )}

          </section>

        </div>

        {/* DOCUMENT HISTORY */}

        <section className="ocr-history-card">

          <div className="ocr-history-heading">

            <div>
              <h3>Document History</h3>

              <p>
                Review uploaded documents and their processing status.
              </p>
            </div>

            <span>{documents.length} Documents</span>

          </div>

          {documents.length === 0 ? (

            <div className="ocr-history-empty">
              No uploaded documents yet.
            </div>

          ) : (

            <div className="ocr-history-table-wrap">

              <table className="ocr-history-table">

                <thead>
                  <tr>
                    <th>Document Name</th>
                    <th>Upload Date</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>

                  {documents.map((document) => (

                    <tr key={document.id}>

                      <td>
                        <FileText size={17} />
                        {document.fileName}
                      </td>

                      <td>{document.uploadedAt}</td>

                      <td>

                        <span
                          className={`ocr-status ${
                            document.status === "Approved"
                              ? "approved"
                              : document.status === "Rejected"
                              ? "rejected"
                              : "pending"
                          }`}
                        >
                          {document.status}
                        </span>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </div>

    </article>
  );
}

function DocumentExtractionPage({ selectedFile, onBack, onSave }) {
  const [formType, setFormType] = useState("Energy Data Entry");
  const [formValues, setFormValues] = useState({});
  const [isExtracted, setIsExtracted] = useState(false);
  const [showExtractedText, setShowExtractedText] = useState(false);
  const [extractedText, setExtractedText] = useState("");

  const config = entryPages[formType];
  const Icon = config.icon;

  const handleExtractAndFill = () => {
    const emptyValues = {};

    config.sections.forEach((section) => {
      section.fields.forEach((field) => {
        emptyValues[field.name] = "";
      });
    });

    // Temporary demonstration values.
    // Replace these with actual OCR API results later.
    const demoValues = {
      "Energy Data Entry": {
        energy_source: "Electricity",
        meter_type: "Main Meter",
        consumption: "12500",
        consumption_unit: "kWh",
        demand: "85",
        demand_unit: "kW",
      },

      "Cost Data Entry": {
        cost_category: "Electricity",
        currency: "MYR (RM)",
        amount: "6250.00",
        total_amount: "6250.00",
      },
    };

    setFormValues({
      ...emptyValues,
      ...(demoValues[formType] || {}),
    });

    setExtractedText(
      `DEMO MODE — OCR NOT CONNECTED

Uploaded document: ${selectedFile?.name || "Unknown"}

The actual Malay text from your electricity bill has not been extracted yet.

The OCR and Malay-to-English translation service will be integrated later.

The values currently displayed in the form are demonstration values, not verified information from your uploaded bill.`
    );

    setIsExtracted(true);
    setShowExtractedText(false);
  };

  const handleFieldChange = (name, value) => {
    setFormValues((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSave = (event) => {
    event.preventDefault();
    onSave(config.title, formValues);
  };

  return (
    <section className="document-extraction-page">

      <div className="document-extraction-toolbar">
        <button
          type="button"
          className="back-home-button"
          onClick={onBack}
        >
          <ArrowLeft size={17} />
          Back to Dashboard
        </button>

        <span>DOCUMENT PROCESSING WORKSPACE</span>
      </div>

      <div className="document-extraction-heading">
        <div className="document-extraction-icon">
          <ScanLine size={27} />
        </div>

        <div>
          <span>SMART DOCUMENT IMPORT</span>
          <h1>Document Extraction</h1>
          <p>
            Extract information from Malaysian utility bills
            and transfer it into the appropriate data entry form.
          </p>
        </div>
      </div>

      <div className="document-source-strip">
        <FileText size={22} />

        <div>
          <strong>{selectedFile?.name}</strong>
          <span>Uploaded document</span>
        </div>

        <span className="document-source-status">
          Ready for processing
        </span>
      </div>

      <div className="document-extraction-workspace">

        <div className="document-extraction-controls">

          <div>
            <span className="extraction-step">STEP 01</span>
            <h2>Select Data Entry Form</h2>
            <p>
              Choose the destination form for the extracted information.
            </p>
          </div>

          <div className="extraction-form-selector">
            <label htmlFor="extraction-form-type">
              Form Type
            </label>

            <select
              id="extraction-form-type"
              value={formType}
              onChange={(event) => {
                setFormType(event.target.value);
                setIsExtracted(false);
                setFormValues({});
                setShowExtractedText(false);
              }}
            >
              {Object.keys(entryPages).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="extraction-start-button"
            onClick={handleExtractAndFill}
          >
            <ScanLine size={18} />
            Extract & Fill Form
          </button>

        </div>

        {isExtracted ? (

          <form
            className="document-extraction-form"
            onSubmit={handleSave}
          >

            <div className="extraction-results-heading">
              <div className="document-extraction-icon">
                <Icon size={23} />
              </div>

              <div>
                <span className="extraction-step">STEP 02</span>
                <h2>{config.title}</h2>
                <p>
                  Review and edit the information before saving.
                </p>
              </div>

              <span className="extraction-demo-status">
                Demonstration Data
              </span>
            </div>

            {config.sections.map((section, index) => (

              <section
                className="entry-section extraction-entry-section"
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
                      value={formValues[field.name] ?? ""}
                      onChange={handleFieldChange}
                    />
                  ))}

                </div>

              </section>

            ))}

            <div className="document-extraction-footer">

              <button
                type="button"
                className="view-extracted-text-button"
                onClick={() =>
                  setShowExtractedText((current) => !current)
                }
                aria-expanded={showExtractedText}
              >
                <FileText size={17} />
                {showExtractedText
                  ? "Hide Extracted Text"
                  : "View Extracted Text"}
              </button>

              <button
                type="submit"
                className="entry-save-button"
              >
                <Save size={17} />
                Save Entry
              </button>

            </div>

            {showExtractedText && (
              <div className="extracted-text-panel">
                <div className="extracted-text-heading">
                  <strong>Extracted Document Text</strong>
                  <span>English translation / OCR output</span>
                </div>

                <pre>{extractedText}</pre>
              </div>
            )}

          </form>

        ) : (

          <div className="extraction-empty-state">
            <ScanLine size={35} />

            <strong>Ready to extract your document</strong>

            <p>
              Select the appropriate form type above and click
              Extract & Fill Form to continue.
            </p>
          </div>

        )}

      </div>

    </section>
  );
}


// ========================================

// MAIN APPLICATION

// ========================================

function App() {



const handleDemoLogin = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const profile = DEMO_PROFILES[normalizedEmail];

  if (!profile || password !== DEMO_PASSWORD) {
    throw new Error("Invalid email address or password.");
  }

  if (profile.active !== true) {
    throw new Error(
      "Your account is inactive. Contact your Manager."
    );
  }

  // Save the complete user profile
  setCurrentUser({ ...profile });

  setActivePage("Home");
  setActiveNav("Home");
  setNotice("");
};

const handleLogout = () => {

  setCurrentUser(null);

  setActivePage("Home");

  setActiveNav("Home");

  setSelectedFile(null);

  setNotice("");

};

  const fileInputRef = useRef(null);

  const [currentUser, setCurrentUser] = useState(null);

  const [activePage, setActivePage] = useState("Home");
  const [activeNav, setActiveNav] = useState("Home");

  const [selectedFile, setSelectedFile] = useState(null);

  // Temporary OCR demo data
const [extractedData, setExtractedData] = useState(null);
const [ocrDocuments, setOcrDocuments] = useState([]);

  const [isDragging, setIsDragging] = useState(false);

  const [notice, setNotice] = useState("");

  // Temporary frontend records.

  // These are NOT saved to Firebase yet.

  const [savedRecords, setSavedRecords] = useState(() => {

  try {

    const storedRecords = localStorage.getItem("energylens_saved_records");

    return storedRecords ? JSON.parse(storedRecords) : {};

  } catch (error) {

    console.error("Unable to load records:", error);

    return {};

  }

});

// Save records to localStorage whenever records change

useEffect(() => {

  try {

    localStorage.setItem(

      "energylens_saved_records",

      JSON.stringify(savedRecords)

    );

  } catch (error) {

    console.error("Unable to save records:", error);

  }

}, [savedRecords]);

// Synchronise records between browser tabs

useEffect(() => {

  const syncRecords = (event) => {

    if (event.key === "energylens_saved_records") {

      try {

        setSavedRecords(

          event.newValue ? JSON.parse(event.newValue) : {}

        );

      } catch (error) {

        console.error("Unable to synchronise records:", error);

      }

    }

  };

  window.addEventListener("storage", syncRecords);

  return () => {

    window.removeEventListener("storage", syncRecords);

  };

}, []);

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
    setExtractedData(null);
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

      handleLogout();

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

    setExtractedData(null);
    setNotice("");
    setActiveNav("Home");
    setActivePage("Document Extraction");
  };

  const handleOCRFieldChange = (field, value) => {
    setExtractedData((current) =>
      current ? { ...current, [field]: value } : current
    );
  };

  const handleOCRDecision = (decision) => {
    if (!extractedData || extractedData.status !== "Pending Review") {
      return;
    }

    setOcrDocuments((current) =>
      current.map((document) =>
        document.id === extractedData.id
          ? { ...document, status: decision }
          : document
      )
    );

    setExtractedData((current) => ({
      ...current,
      status: decision,
    }));

    setNotice(
      `Document ${decision.toLowerCase()} successfully in demo mode.`
    );
  };


  // ========================================

  // RENDER

  // ========================================

  const currentEntryConfig = entryPages[activePage];

  const currentRecordConfig = recordPageConfigs[activePage];

  // TEMPORARY MANAGER DASHBOARD PREVIEW

  // ========================================

// LOGIN AND ROLE-BASED DASHBOARD ROUTING

// ========================================

if (!currentUser) {

  return (

    <LoginPage

      onLogin={handleDemoLogin}

    />

  );

}

// MANAGER DASHBOARD

if (currentUser.role === "manager") {

  return (

    <ManagerDashboard

      records={savedRecords}

      onUpdateRecord={(category, id, updatedFields) => {

        setSavedRecords((current) => ({

          ...current,

          [category]: (current[category] || []).map((record) =>

            String(record.id) === String(id)

              ? {

                  ...record,

                  ...updatedFields,

                  updatedAt: new Date().toLocaleString(),

                }

              : record

          ),

        }));

      }}

      onDeleteRecord={(category, id) => {

        setSavedRecords((current) => ({

          ...current,

          [category]: (current[category] || []).filter(

            (record) => String(record.id) !== String(id)

          ),

        }));

      }}

      onLogout={handleLogout}

    />

  );

}


// ANALYST DASHBOARD

if (currentUser.role === "analyst") {
  return (
    <AnalystDashboard
      user={currentUser}
      onLogout={handleLogout}
    />
  );
}



// STAKEHOLDER DASHBOARD

if (currentUser.role === "stakeholder") {
  return (
    <StakeholderDashboard
      user={currentUser}
      onLogout={handleLogout}
    />
  );
}


// STAFF DASHBOARD CONTINUES BELOW

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

            <h1>
  Welcome, {currentUser?.displayName || "Staff"}!
</h1>

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

        ) : activePage === "Document Extraction" ? (

          <DocumentExtractionPage
            selectedFile={selectedFile}
            onBack={handleBackHome}
            onSave={handleSaveEntry}
          />

        ) : currentEntryConfig ? (
          <EntryPage

            key={activePage}

            config={currentEntryConfig}

            onBack={handleBackHome}

            onSave={handleSaveEntry}

            savedCount={(savedRecords[activePage] || []).length}

          />

        ) : currentRecordConfig ? (

          <RecordPage

            key={activePage}

            config={currentRecordConfig}

            records={savedRecords[currentRecordConfig.entryTitle] || []}

            onBack={handleBackHome}

          />

        ) : (

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
