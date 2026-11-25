import { useEffect, useMemo, useState } from "react";
import {
  createManagedUser,
  setManagedUserStatus,
} from "./services/managerUserService";
import {
  getAllFacilities,
  createFacility,
  updateFacility,
  archiveFacility,
} from "./services/facilityService";
import {
  collection,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase/firestore";
import {
  Activity,
  ArrowUpRight,
  Bell,
  Building2,
  CheckCircle2,
  ChevronDown,
  Database,
  FileClock,
  Pencil,
  Trash2,
  FileText,
  Gauge,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import "./ManagerDashboard.css";

const EMPTY_RECORDS = {};

const EMPTY_FACILITY = {
  facilityName: "",
  facilitySize: "",
  facilityType: "Commercial",
  location: "",
};

const RECORD_CATEGORIES = [
  { key: "Energy Data Entry", label: "Energy Records" },
  { key: "Cost Data Entry", label: "Cost Records" },
  { key: "Operational Data Entry", label: "Operational Records" },
  { key: "Equipment Registration", label: "Equipment Records" },
  { key: "Environmental Data Entry", label: "Environmental Records" },
];

const NAV_ITEMS = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "User Management", icon: Users },
  { label: "Roles & Permissions", icon: ShieldCheck },
  { label: "Facility Management", icon: Building2 },
  { label: "All Records", icon: Database },
  { label: "OCR Management", icon: FileText },
  { label: "System Configuration", icon: Settings },
];

const ROLE_DETAILS = [
  {
    role: "Manager",
    description: "Full system control and administration.",
    permissions: ["Manage users and groups", "Assign roles and permissions", "Manage system configuration", "View, add, edit and delete all records", "Access all dashboards and system functions"],
  },
  {
    role: "Analyst",
    description: "Data quality, processing and analytical results.",
    permissions: ["Perform PCA and TOPSIS analysis", "View EPI results and energy predictions", "Run simulation and scenario analysis", "View and correct OCR extraction results"],
  },
  {
    role: "Staff",
    description: "Daily facility data collection and submission.",
    permissions: ["View existing records", "Manually enter energy, cost and operational data", "Add equipment and environmental information", "Upload documents using OCR", "Review extracted information before submitting"],
  },
  {
    role: "Stakeholder",
    description: "Read-only facility monitoring.",
    permissions: ["View facility statistics", "Monitor energy consumption and electricity costs", "View monthly charts and reports", "Review EPI performance", "No data modification"],
  },
];

function StatCard({ icon: Icon, label, value, note, tone }) {
  return (
    <article className={`manager-stat-card ${tone}`}>
      <div className="manager-stat-top">
        <span className="manager-stat-icon"><Icon size={21} /></span>
        <span className="manager-stat-note">{note}</span>
      </div>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="manager-page-heading">
      <div>
        <span className="manager-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

function EmptyState({ icon: Icon = Database, title, description }) {
  return (
    <div className="manager-empty-state">
      <span><Icon size={28} /></span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function Modal({ title, onClose, children, className = "" }) {
  return (
    <div className="manager-modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className={`manager-modal ${className}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="manager-modal-heading">
          <h2>{title}</h2>
          <button type="button" className="manager-icon-button" onClick={onClose} aria-label="Close">
            <X size={19} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

export default function ManagerDashboard({
  currentUser,
  records = EMPTY_RECORDS,
  onUpdateRecord,
  onDeleteRecord,
  onLogout = () => {}
}) {
  const [activePage, setActivePage] = useState("Overview");
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [facilities, setFacilities] = useState([]);
  const [facilitiesLoading, setFacilitiesLoading] = useState(true);
  const [facilitiesError, setFacilitiesError] = useState("");
  const [facilitySaving, setFacilitySaving] = useState(false);
  const [managedRecords, setManagedRecords] = useState(records || EMPTY_RECORDS);
  const [searchTerm, setSearchTerm] = useState("");
  const [recordCategory, setRecordCategory] = useState("All");
  const [editingRecord, setEditingRecord] = useState(null);
  const [recordEditValues, setRecordEditValues] = useState({});
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [modal, setModal] = useState("");
  const [notice, setNotice] = useState("");
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "Staff" });
  const [newFacility, setNewFacility] = useState(EMPTY_FACILITY);
  const [editingFacility, setEditingFacility] = useState(null);
  const [userSaving, setUserSaving] = useState(false);

  // Load all user profiles from Firestore, including inactive accounts.
  useEffect(() => {
    let cancelled = false;

    const loadUsers = async () => {
      try {
        const snapshot = await getDocs(
          collection(db, "users")
        );

        const loadedUsers = snapshot.docs.map((userDoc) => {
          const data = userDoc.data();

          return {
            id: userDoc.id,
            name:
              data.displayName ||
              data.name ||
              data.fullName ||
              data.email ||
              "Unnamed user",
            email: data.email || "",
            role: String(data.role || "staff").toLowerCase(),
            status: data.active === true ? "Active" : "Inactive",
          };
        });

        if (!cancelled) {
          setUsers(loadedUsers);
          setUsersError("");
        }
      } catch (error) {
        console.error(
          "Unable to load users from Firestore:",
          error
        );

        if (!cancelled) {
          setUsersError(
            error.message || "Unable to load user accounts."
          );
        }
      } finally {
        if (!cancelled) {
          setUsersLoading(false);
        }
      }
    };

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, []);


  const allRecords = useMemo(
    () => Object.entries(managedRecords || {}).flatMap(([category, items]) =>
      (Array.isArray(items) ? items : []).map((item) => ({ ...item, category }))
    ),
    [managedRecords]
  );

  const filteredUsers = users.filter((user) =>
    `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
const filteredFacilities = facilities.filter((facility) =>
  [
    facility.facilityName,
    facility.facilityType,
    facility.location,
  ]
    .join(" ")
    .toLowerCase()
    .includes(searchTerm.toLowerCase())
);

  const filteredRecords = allRecords.filter((record) => {
    const matchesCategory = recordCategory === "All" || record.category === recordCategory;
    const matchesSearch = Object.values(record).some((value) =>
      String(value ?? "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    return matchesCategory && matchesSearch;
  });

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3200);
  };

  
const addUser = async (event) => {
  event.preventDefault();

  if (currentUser?.role !== "manager") {
    showNotice("Only Managers can create user accounts.");
    return;
  }

  if (!newUser.name.trim() || !newUser.email.trim()) {
    showNotice("Please complete all user information.");
    return;
  }

  try {
    setUserSaving(true);

    const result = await createManagedUser({
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    });

    const newProfile = {
      id: result.uid,
      name: result.displayName,
      email: result.email,
      role: result.role,
      status: "Active",
    };

    setUsers((current) => [
      ...current.filter((user) => user.id !== result.uid),
      newProfile,
    ]);

    setNewUser({
      name: "",
      email: "",
      role: "Staff",
    });

    setModal("");

    if (result.emailSent) {
      showNotice(
        "User account created successfully. Password-reset email sent."
      );
    } else {
      showNotice(
        "Account created, but the password-reset email failed. You can resend it."
      );
    }
  } catch (error) {
    console.error("Unable to create user:", error);

    showNotice(
      error.message || "Unable to create user account."
    );
  } finally {
    setUserSaving(false);
  }
};


const addFacility = async (event) => {
  event.preventDefault();

  if (currentUser?.role !== "manager") {
    showNotice("Only Managers can create facilities.");
    return;
  }

  try {
    setFacilitySaving(true);

    const facilityData = {
      facilityName: newFacility.facilityName.trim(),
      facilitySize: Number(newFacility.facilitySize),
      facilityType: newFacility.facilityType,
      location: newFacility.location.trim(),
    };

    if (!facilityData.facilityName || !facilityData.location) {
      throw new Error("Please complete all facility fields.");
    }

    const facilityId = await createFacility(
      facilityData,
      currentUser
    );

    setFacilities((current) => [
      ...current,
      {
        ...facilityData,
        facilityId,
        active: true,
      },
    ].sort((a, b) =>
      a.facilityName.localeCompare(b.facilityName)
    ));

    setNewFacility(EMPTY_FACILITY);
    setModal("");
    showNotice("Facility successfully saved to Firestore.");
  } catch (error) {
    console.error("Unable to create facility:", error);
    showNotice(error.message || "Unable to create facility.");
  } finally {
    setFacilitySaving(false);
  }
};

const saveFacilityEdit = async (event) => {
  event.preventDefault();

  if (!editingFacility) return;

  try {
    setFacilitySaving(true);

    const facilityData = {
      facilityName: newFacility.facilityName.trim(),
      facilitySize: Number(newFacility.facilitySize),
      facilityType: newFacility.facilityType,
      location: newFacility.location.trim(),
    };

    await updateFacility(
      editingFacility.facilityId,
      facilityData,
      currentUser
    );

    setFacilities((current) =>
      current.map((facility) =>
        facility.facilityId === editingFacility.facilityId
          ? { ...facility, ...facilityData }
          : facility
      ).sort((a, b) =>
        a.facilityName.localeCompare(b.facilityName)
      )
    );

    setEditingFacility(null);
    setNewFacility(EMPTY_FACILITY);
    setModal("");
    showNotice("Facility successfully updated.");
  } catch (error) {
    console.error("Unable to update facility:", error);
    showNotice(error.message || "Unable to update facility.");
  } finally {
    setFacilitySaving(false);
  }
};


// ARCHIVE FACILITY IN FIRESTORE
const handleArchiveFacility = async (facility) => {
  if (currentUser?.role !== "manager") {
    showNotice("Only Managers can archive facilities.");
    return;
  }

  if (!facility?.facilityId) {
    showNotice("Invalid facility ID.");
    return;
  }

  const confirmed = window.confirm(
    `Are you sure you want to archive "${facility.facilityName}"?`
  );

  if (!confirmed) return;

  try {
    setFacilitySaving(true);

    await archiveFacility(
      facility.facilityId,
      currentUser
    );

    // Remove archived facility from active facility list.
    setFacilities((current) =>
      current.filter(
        (item) => item.facilityId !== facility.facilityId
      )
    );

    showNotice(
      `${facility.facilityName} archived successfully.`
    );

  } catch (error) {
    console.error("Unable to archive facility:", error);

    showNotice(
      error.message || "Unable to archive facility."
    );

  } finally {
    setFacilitySaving(false);
  }
};



const toggleUserStatus = async (id) => {
  const user = users.find((item) => item.id === id);

  if (!user) return;

  if (String(id).startsWith("demo-")) {
    showNotice("Demo users cannot be managed as real accounts.");
    return;
  }

  const nextActive = user.status !== "Active";

  try {
    setUserSaving(true);

    await setManagedUserStatus(id, nextActive);

    setUsers((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status: nextActive ? "Active" : "Inactive",
            }
          : item
      )
    );

    showNotice(
      nextActive
        ? "User activated successfully."
        : "User deactivated successfully."
    );

  } catch (error) {
    console.error("Unable to update user status:", error);

    showNotice(
      error.message || "Unable to update user status."
    );
  } finally {
    setUserSaving(false);
  }
};


const openFacilityEditor = (facility) => {
  setEditingFacility(facility);

  setNewFacility({
    facilityName: facility.facilityName || "",
    facilitySize: String(facility.facilitySize ?? ""),
    facilityType: facility.facilityType || "Commercial",
    location: facility.location || "",
  });

  setModal("facility");
};

  const updateUserRole = async (id, role) => {
    if (String(id).startsWith("demo-")) {
      setUsers((current) => current.map((user) =>
        user.id === id ? { ...user, role: role.toLowerCase() } : user
      ));
      showNotice("Preview user role updated locally; no Firebase profile was changed.");
      return;
    }

    try {
      await updateDoc(doc(db, "users", id), { role: role.toLowerCase() });
      setUsers((current) => current.map((user) =>
        user.id === id ? { ...user, role: role.toLowerCase() } : user
      ));
      showNotice("User role updated successfully.");
    } catch (error) {
      console.error("Unable to update user role:", error);
      showNotice(error.message || "Unable to update user role.");
    }
  };

  const openRecordEditor = (record) => {
    const editableFields = Object.fromEntries(
      Object.entries(record).filter(([key, value]) =>
        !["id", "savedAt", "updatedAt", "category"].includes(key) &&
        (value === null || ["string", "number", "boolean"].includes(typeof value))
      ).map(([key, value]) => [key, value ?? ""])
    );
    setEditingRecord(record);
    setRecordEditValues(editableFields);
  };

  const saveRecordEdit = (event) => {
    event.preventDefault();
    if (!editingRecord) return;

    const updatedFields = Object.fromEntries(
      Object.entries(recordEditValues).map(([key, value]) => {
        const originalValue = editingRecord[key];
        if (typeof originalValue === "number" && value !== "") return [key, Number(value)];
        if (typeof originalValue === "boolean") return [key, value === "true"];
        return [key, value];
      })
    );

    const { category, id } = editingRecord;
    setManagedRecords((current) => ({
      ...current,
      [category]: (current[category] || []).map((item) =>
        String(item.id) === String(id)
          ? { ...item, ...updatedFields, updatedAt: new Date().toLocaleString() }
          : item
      ),
    }));
    onUpdateRecord?.(category, id, updatedFields);
    setEditingRecord(null);
    setRecordEditValues({});
    showNotice("Record updated successfully in the Manager workspace.");
  };

  const confirmDeleteRecord = () => {
    if (!recordToDelete) return;
    const { category, id } = recordToDelete;
    setManagedRecords((current) => ({
      ...current,
      [category]: (current[category] || []).filter((item) => String(item.id) !== String(id)),
    }));
    onDeleteRecord?.(category, id);
    setRecordToDelete(null);
    showNotice("Record deleted from the Manager workspace.");
  };

  const getRecordCategoryLabel = (category) =>
    RECORD_CATEGORIES.find((item) => item.key === category)?.label || category.replace(" Data Entry", " Records");

  const getRecordFieldLabel = (field) => field
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  const renderOverview = () => (
    <>
      <PageHeading
        eyebrow="MANAGEMENT WORKSPACE"
        title="Manager Dashboard"
        description="Monitor EnergyLens activity and manage the system from one place."
      />
      <div className="manager-stats-grid">
        <StatCard icon={Users} label="Total Users" value={users.length} note="Firebase profiles" tone="blue" />
        <StatCard icon={Building2} label="Facilities" value={facilities.length} note="Firestore facilities" tone="green" />
        <StatCard icon={Database} label="Data Records" value={allRecords.length} note="Current session" tone="purple" />
        <StatCard icon={FileClock} label="Pending OCR Reviews" value="0" note="Not connected" tone="orange" />
      </div>

      <div className="manager-overview-grid">
        <section className="manager-card">
          <div className="manager-card-heading">
            <div>
              <h2>System Management</h2>
              <p>Open a module to manage the EnergyLens workspace.</p>
            </div>
            <SlidersHorizontal size={20} />
          </div>
          <div className="manager-module-grid">
            {[
              { title: "User Management", description: "Create user accounts, assign roles and manage access.", icon: Users },
              { title: "Roles & Permissions", description: "Review access levels for each role.", icon: ShieldCheck },
              { title: "Facility Management", description: "Maintain facility information.", icon: Building2 },
              { title: "All Records", description: "Review submitted facility data.", icon: Database },
              { title: "OCR Management", description: "Review document extraction workflow.", icon: FileText },
              { title: "System Configuration", description: "View application configuration.", icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.title} type="button" className="manager-module-card" onClick={() => { setActivePage(item.title); setSearchTerm(""); }}>
                  <span className="manager-module-icon"><Icon size={21} /></span>
                  <span className="manager-module-copy"><strong>{item.title}</strong><small>{item.description}</small></span>
                  <ArrowUpRight size={17} />
                </button>
              );
            })}
          </div>
        </section>

        <section className="manager-card manager-activity-card">
          <div className="manager-card-heading">
            <div>
              <h2>System Status</h2>
              <p>Current frontend development status.</p>
            </div>
            <Activity size={20} />
          </div>
          <div className="manager-status-list">
            <div><span className="manager-status-dot ready" /><span>Staff workspace</span><strong>Available</strong></div>
            <div><span className="manager-status-dot ready" /><span>Data entry forms</span><strong>Available</strong></div>
            <div><span className="manager-status-dot pending" /><span>Firebase database</span><strong>Connected in this workspace</strong></div>
            <div><span className="manager-status-dot pending" /><span>Authentication</span><strong>Connected</strong></div>
            <div><span className="manager-status-dot pending" /><span>OCR processing</span><strong>Not connected</strong></div>
          </div>
          <div className="manager-demo-note">
            <CheckCircle2 size={17} />
            <span>User profiles and facility information are loaded from Firebase Firestore.</span>
          </div>
        </section>
      </div>
    </>
  );

  const renderUsers = () => (
    <>
      <PageHeading
        eyebrow="ACCESS ADMINISTRATION"
        title="User Management"
        description="Create demo user entries, assign roles and activate or deactivate access."
        action={<button className="manager-primary-button" type="button" onClick={() => setModal("user")}><Plus size={17} /> Add User</button>}
      />
      <section className="manager-card">
        <div className="manager-table-toolbar">
          <div><h2>System Users</h2><p>{users.length} registered user profiles</p></div>
          <label className="manager-search"><Search size={17} /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search users..." /></label>
        </div>
        {usersLoading && <p className="manager-footnote">Loading user accounts from Firebase...</p>}
        {usersError && <p className="manager-footnote" role="alert">{usersError}</p>}
        <div className="manager-table-wrap">
          <table className="manager-table">
            <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td><strong>{user.name}</strong></td>
                  <td>{user.email}</td>
                  <td><select className="manager-role-select" value={user.role} onChange={(event) => updateUserRole(user.id, event.target.value)}><option value="manager">Manager</option><option value="analyst">Analyst</option><option value="staff">Staff</option><option value="stakeholder">Stakeholder</option></select></td>
                  <td><span className={`manager-status-pill ${user.status === "Active" ? "active" : "inactive"}`}>{user.status}</span></td>
                  <td><button type="button" className="manager-text-button" onClick={() => toggleUserStatus(user.id)}>{user.status === "Active" ? "Deactivate" : "Activate"}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && <EmptyState icon={Users} title="No users found" description="Try another search term." />}
        </div>
      </section>
      <p className="manager-footnote">User profiles and role/status changes are read from and saved to Firestore. Creating Firebase Authentication accounts is a separate secure workflow and is not performed by this form.</p>
    </>
  );

  const renderRoles = () => (
    <>
      <PageHeading eyebrow="ACCESS CONTROL" title="Roles & Permissions" description="Review the four EnergyLens roles and their intended responsibilities." />
      <div className="manager-role-grid">
        {ROLE_DETAILS.map((item) => (
          <article className="manager-card manager-role-card" key={item.role}>
            <div className="manager-role-title"><span className={`manager-role-symbol ${item.role.toLowerCase()}`}><ShieldCheck size={20} /></span><div><h2>{item.role}</h2><p>{item.description}</p></div></div>
            <ul>{item.permissions.map((permission) => <li key={permission}><CheckCircle2 size={16} />{permission}</li>)}</ul>
          </article>
        ))}
      </div>
      <p className="manager-footnote">These permissions reflect the role descriptions provided for the EnergyLens project. Actual enforcement must be implemented with Firebase security rules and application-level authorization.</p>
    </>
  );

  
const renderFacilities = () => (
  <>
    <PageHeading
      eyebrow="FACILITY ADMINISTRATION"
      title="Facility Management"
      description="Manage registered EnergyLens facilities."
      action={
        <button
          className="manager-primary-button"
          type="button"
          onClick={() => {
            setEditingFacility(null);
            setNewFacility(EMPTY_FACILITY);
            setModal("facility");
          }}
        >
          <Plus size={17} /> Add Facility
        </button>
      }
    />

    <section className="manager-card">
      <div className="manager-table-toolbar">
        <div>
          <h2>Registered Facilities</h2>
          <p>{facilities.length} registered facilities</p>
        </div>

        <label className="manager-search">
          <Search size={17} />
          <input
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            placeholder="Search facilities..."
          />
        </label>
      </div>

      {facilitiesLoading ? (
        <p className="manager-footnote">
          Loading facilities from Firestore...
        </p>
      ) : facilitiesError ? (
        <div className="manager-error-message" role="alert">
          {facilitiesError}
          <button
            type="button"
            className="manager-text-button"
            onClick={async () => {
              try {
                setFacilitiesLoading(true);
                setFacilitiesError("");
                setFacilities(await getAllFacilities());
              } catch (error) {
                setFacilitiesError(error.message);
              } finally {
                setFacilitiesLoading(false);
              }
            }}
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="manager-table-wrap">
          <table className="manager-table">
            <thead>
              <tr>
                <th>Facility</th>
                <th>Size (m²)</th>
                <th>Location</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredFacilities.map((facility) => (
                <tr key={facility.facilityId}>
                  <td>
                    <strong>{facility.facilityName}</strong>
                  </td>

                  <td>{facility.facilitySize}</td>

                  <td>{facility.location || "—"}</td>

                  <td>{facility.facilityType}</td>

                  <td>
                    <span className="manager-status-pill active">
                      Active
                    </span>
                  </td>

                  <td>
                    <button
                      type="button"
                      className="manager-text-button"
                      disabled={facilitySaving}
                      onClick={() => openFacilityEditor(facility)}
                    >
                      Edit
                    </button>

                    {" "}

                    <button
                      type="button"
                      className="manager-text-button"
                      disabled={facilitySaving}
                      onClick={() => handleArchiveFacility(facility)}
                    >
                      Archive
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredFacilities.length === 0 && (
            <EmptyState
              icon={Building2}
              title="No facilities found"
              description="Add a facility or try another search term."
            />
          )}
        </div>
      )}
    </section>

    <p className="manager-footnote">
      Facility information is stored in Firebase Firestore.
    </p>
  </>
);


  const renderRecords = () => (
    <>
      <PageHeading
        eyebrow="DATA OVERSIGHT"
        title="All Records"
        description="View, edit and delete submitted records across all five EnergyLens data categories."
      />
      <div className="manager-record-category-grid">
        <button type="button" className={`manager-record-category-card ${recordCategory === "All" ? "selected" : ""}`} onClick={() => setRecordCategory("All")}>
          <span>All Categories</span><strong>{allRecords.length}</strong>
        </button>
        {RECORD_CATEGORIES.map((category) => {
          const count = (managedRecords[category.key] || []).length;
          return (
            <button
              type="button"
              key={category.key}
              className={`manager-record-category-card ${recordCategory === category.key ? "selected" : ""}`}
              onClick={() => setRecordCategory(category.key)}
            >
              <span>{category.label}</span><strong>{count}</strong>
            </button>
          );
        })}
      </div>

      <section className="manager-card">
        <div className="manager-table-toolbar">
          <div>
            <h2>{recordCategory === "All" ? "Submitted Data" : getRecordCategoryLabel(recordCategory)}</h2>
            <p>{filteredRecords.length} of {allRecords.length} records shown</p>
          </div>
          <label className="manager-search"><Search size={17} /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search facility, reference or details..." /></label>
        </div>
        {filteredRecords.length ? (
          <div className="manager-table-wrap">
            <table className="manager-table manager-records-table">
              <thead><tr><th>Category</th><th>Facility / Equipment</th><th>Reference / Date</th><th>Submitted</th><th>Record ID</th><th>Actions</th></tr></thead>
              <tbody>{filteredRecords.map((record, index) => (
                <tr key={`${record.category}-${record.id ?? index}`}>
                  <td><span className="manager-category-tag">{getRecordCategoryLabel(record.category)}</span></td>
                  <td><strong>{record.facility || record.facility_name || record.equipment_name || record.building_name || "—"}</strong></td>
                  <td>{record.record_date || record.billing_start || record.invoice_reference || record.equipment_id || record.meter_number || "—"}</td>
                  <td>{record.savedAt || "—"}</td>
                  <td>{record.id ?? "—"}</td>
                  <td>
                    <div className="manager-record-actions">
                      <button type="button" className="manager-edit-button" onClick={() => openRecordEditor(record)}><Pencil size={14} /> Edit</button>
                      <button type="button" className="manager-delete-button" onClick={() => setRecordToDelete(record)}><Trash2 size={14} /> Delete</button>
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Database}
            title={allRecords.length ? "No matching records" : "No records available yet"}
            description={allRecords.length ? "Change the category filter or search term and try again." : "Records saved from the Staff workspace will appear here. Save a sample entry to test this page."}
          />
        )}
      </section>
      <p className="manager-footnote">Manager-only controls in this frontend preview. Changes are held in the current session until the Firebase database is connected.</p>
    </>
  );

  const renderOCR = () => (
    <>
      <PageHeading eyebrow="DOCUMENT WORKFLOW" title="OCR Management" description="Monitor document uploads and extracted information submitted for review." />
      <section className="manager-card manager-ocr-card">
        <span className="manager-large-icon"><FileText size={30} /></span>
        <h2>OCR integration is not connected</h2>
        <p>The Staff workspace currently has a document upload interface, but OCR processing and extraction review are not connected to this Manager preview.</p>
        <div className="manager-ocr-steps">
          <div><span>01</span><strong>Staff uploads a document</strong><small>PDF, JPG or PNG</small></div>
          <div><span>02</span><strong>OCR extracts information</strong><small>Backend processing</small></div>
          <div><span>03</span><strong>Analyst reviews extracted values</strong><small>Correction and validation</small></div>
          <div><span>04</span><strong>Approved data is submitted</strong><small>Saved to the database</small></div>
        </div>
        <span className="manager-status-pill inactive">Not connected</span>
      </section>
    </>
  );

  const renderSettings = () => (
    <>
      <PageHeading eyebrow="APPLICATION ADMINISTRATION" title="System Configuration" description="Review the planned application configuration areas." />
      <section className="manager-card manager-settings-card">
        {[
          ["User access", "Account creation, role assignment and account status are planned for Firebase Authentication."],
          ["Database", "EnergyLens facility information and user profiles are connected to Firebase Firestore."],
          ["Document processing", "OCR processing requires a configured backend or document-processing service."],
          ["Notifications", "In-app notifications and email alerts are not configured."],
        ].map(([title, description]) => (
          <div className="manager-setting-row" key={title}><span className="manager-setting-icon"><Settings size={19} /></span><div><strong>{title}</strong><p>{description}</p></div><span className="manager-status-pill inactive">Pending</span></div>
        ))}
      </section>
    </>
  );

  const pageRenderers = {
    Overview: renderOverview,
    "User Management": renderUsers,
    "Roles & Permissions": renderRoles,
    "Facility Management": renderFacilities,
    "All Records": renderRecords,
    "OCR Management": renderOCR,
    "System Configuration": renderSettings,
  };

  return (
    <div className="manager-shell">
      <aside className="manager-sidebar">
        <div className="manager-brand"><span><Gauge size={25} /></span><strong>EnergyLens</strong></div>
        <div className="manager-sidebar-label">ADMINISTRATION</div>
        <nav className="manager-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return <button type="button" key={item.label} className={activePage === item.label ? "active" : ""} onClick={() => { setActivePage(item.label); setSearchTerm(""); }}><Icon size={19} /><span>{item.label}</span></button>;
          })}
        </nav>
        <div className="manager-sidebar-bottom">
          <div className="manager-admin-mini"><span className="manager-avatar">M</span><div><strong>Manager</strong><small>Administrator</small></div></div>
          <button type="button" className="manager-logout-button" onClick={onLogout}><LogOut size={18} /> Log out</button>
        </div>
      </aside>

      <main className="manager-main">
        <header className="manager-topbar">
          <div><span className="manager-topbar-label">ENERGYLENS / ADMIN</span><strong>{activePage}</strong></div>
          <div className="manager-topbar-actions">
            <button type="button" className="manager-icon-button" aria-label="Notifications" onClick={() => showNotice("No new notifications in this preview.")}><Bell size={19} /></button>
            <div className="manager-profile"><span className="manager-avatar">M</span><span><strong>Manager</strong><small>Administrator</small></span><ChevronDown size={16} /></div>
          </div>
        </header>
        <div className="manager-content">
          {pageRenderers[activePage]()}
        </div>
        <footer className="manager-footer"><span>EnergyLens Management Workspace</span><span>Firebase user profiles · Facility/OCR modules pending</span></footer>
      </main>

      {notice && <div className="manager-toast" role="status"><CheckCircle2 size={17} />{notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss"><X size={15} /></button></div>}

      {modal === "user" && (
        <Modal
          title="Create User Account"
          onClose={() => {
            if (!userSaving) setModal("");
          }}
        >
          <form className="manager-form" onSubmit={addUser}>
            <label>Full name<input required value={newUser.name} onChange={(event) => setNewUser({ ...newUser, name: event.target.value })} placeholder="Enter full name" /></label>
            <label>Email address<input required type="email" value={newUser.email} onChange={(event) => setNewUser({ ...newUser, email: event.target.value })} placeholder="name@example.com" /></label>
            <label>Assigned role<select value={newUser.role} onChange={(event) => setNewUser({ ...newUser, role: event.target.value })}><option>Manager</option><option>Analyst</option><option>Staff</option><option>Stakeholder</option></select></label>
            <div className="manager-form-actions">
  <button
    type="button"
    className="manager-secondary-button"
    disabled={userSaving}
    onClick={() => setModal("")}
  >
    Cancel
  </button>

  <button
    type="submit"
    className="manager-primary-button"
    disabled={userSaving}
  >
    {userSaving ? "Creating Account..." : "Create Account"}
  </button>
</div>
          </form>
        </Modal>
      )}

      {modal === "facility" && (
        <Modal
          title={editingFacility ? "Edit Facility" : "Add Facility"}
          onClose={() => {
            if (facilitySaving) return;
            setModal("");
            setEditingFacility(null);
            setNewFacility(EMPTY_FACILITY);
          }}
        >
          <form
            className="manager-form"
            onSubmit={editingFacility ? saveFacilityEdit : addFacility}
          >
            <label>
              Facility name
              <input
                required
                value={newFacility.facilityName}
                onChange={(event) =>
                  setNewFacility((current) => ({
                    ...current,
                    facilityName: event.target.value,
                  }))
                }
                placeholder="Enter facility name"
              />
            </label>

            <label>
              Facility size (m²)
              <input
                required
                type="number"
                min="0.01"
                step="any"
                value={newFacility.facilitySize}
                onChange={(event) =>
                  setNewFacility((current) => ({
                    ...current,
                    facilitySize: event.target.value,
                  }))
                }
                placeholder="Enter facility size"
              />
            </label>

            <label>
              Facility type
              <select
                required
                value={newFacility.facilityType}
                onChange={(event) =>
                  setNewFacility((current) => ({
                    ...current,
                    facilityType: event.target.value,
                  }))
                }
              >
                <option value="Commercial">Commercial</option>
                <option value="Office">Office</option>
                <option value="Academic">Academic</option>
                <option value="Laboratory">Laboratory</option>
                <option value="Residential">Residential</option>
                <option value="Industrial">Industrial</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label>
              Location
              <input
                required
                value={newFacility.location}
                onChange={(event) =>
                  setNewFacility((current) => ({
                    ...current,
                    location: event.target.value,
                  }))
                }
                placeholder="Enter facility location"
              />
            </label>

            <div className="manager-form-actions">
              <button
                type="button"
                className="manager-secondary-button"
                disabled={facilitySaving}
                onClick={() => {
                  setModal("");
                  setEditingFacility(null);
                  setNewFacility(EMPTY_FACILITY);
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="manager-primary-button"
                disabled={facilitySaving}
              >
                {facilitySaving
                  ? "Saving..."
                  : editingFacility
                    ? "Save Changes"
                    : "Add Facility"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {editingRecord && (
        <Modal title={`Edit ${getRecordCategoryLabel(editingRecord.category)}`} onClose={() => setEditingRecord(null)} className="manager-record-modal">
          <form className="manager-form" onSubmit={saveRecordEdit}>
            <p className="manager-record-modal-intro">Update the fields that need correction. Record ID and submission timestamp are preserved.</p>
            <div className="manager-record-form-grid">
              {Object.entries(recordEditValues).map(([field, value]) => {
                const originalValue = editingRecord[field];
                const isLongText = /remarks|description|notes|comment/i.test(field);
                const isDate = /date|billing_start|billing_end/i.test(field);
                const isNumber = typeof originalValue === "number" || /amount|consumption|demand|quantity|cost|tax|total|usage|area|capacity|count|metric_value|measured_value|emission_factor/i.test(field);
                return (
                  <label key={field} className={isLongText ? "manager-form-full" : ""}>
                    {getRecordFieldLabel(field)}
                    {isLongText ? (
                      <textarea rows={3} value={value} onChange={(event) => setRecordEditValues((current) => ({ ...current, [field]: event.target.value }))} />
                    ) : (
                      <input
                        type={isDate ? "date" : isNumber ? "number" : "text"}
                        step={isNumber ? "any" : undefined}
                        value={value}
                        onChange={(event) => setRecordEditValues((current) => ({ ...current, [field]: event.target.value }))}
                      />
                    )}
                  </label>
                );
              })}
            </div>
            <div className="manager-form-actions">
              <button type="button" className="manager-secondary-button" onClick={() => setEditingRecord(null)}>Cancel</button>
              <button type="submit" className="manager-primary-button">Save Changes</button>
            </div>
          </form>
        </Modal>
      )}

      {recordToDelete && (
        <Modal title="Delete Record?" onClose={() => setRecordToDelete(null)}>
          <div className="manager-delete-confirmation">
            <span className="manager-delete-symbol"><Trash2 size={22} /></span>
            <p>Are you sure you want to permanently delete this {getRecordCategoryLabel(recordToDelete.category).toLowerCase()} entry from the current preview?</p>
            <small>This action cannot be undone. The record will be removed from the Manager workspace session.</small>
            <div className="manager-form-actions">
              <button type="button" className="manager-secondary-button" onClick={() => setRecordToDelete(null)}>Cancel</button>
              <button type="button" className="manager-danger-primary" onClick={confirmDeleteRecord}>Delete Record</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}