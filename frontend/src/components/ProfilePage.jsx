import { useEffect, useRef, useState } from "react";
import { ArrowLeft, FileUp, UserRound, X } from "lucide-react";

export default function ProfilePage({ user, onBack, onSavePhoto }) {
  const displayName = user?.displayName || "Staff";

  const role = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "Staff";

  const [photoPreview, setPhotoPreview] = useState(
    user?.photoURL || ""
  );

  const [isPhotoMenuOpen, setIsPhotoMenuOpen] = useState(false);
  const [message, setMessage] = useState("");

  const photoMenuRef = useRef(null);
  const fileInputRef = useRef(null);

  // Close floating menu when clicking outside or pressing Escape
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!photoMenuRef.current?.contains(event.target)) {
        setIsPhotoMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsPhotoMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Upload and save profile picture
  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMessage("Please select a JPG, PNG or WEBP image.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage("Image size must not exceed 2 MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const imageData = reader.result;
      const saved = onSavePhoto(imageData);

      if (saved === false) {
        setMessage("Unable to save photo. Please try again.");
        return;
      }

      setPhotoPreview(imageData);
      setMessage("Profile picture updated successfully.");
      setIsPhotoMenuOpen(false);
    };

    reader.onerror = () => {
      setMessage("Unable to read this image.");
    };

    reader.readAsDataURL(file);
  };

  // Remove profile picture
  const handleRemovePhoto = () => {
    const saved = onSavePhoto("");

    if (saved === false) {
      setMessage("Unable to remove photo. Please try again.");
      return;
    }

    setPhotoPreview("");
    setMessage("Profile picture removed.");
    setIsPhotoMenuOpen(false);
  };

  return (
    <section className="profile-page">

      <div className="profile-page-top">
        <button
          type="button"
          className="back-home-button"
          onClick={onBack}
        >
          <ArrowLeft size={17} />
          Back to Dashboard
        </button>
      </div>

      {/* PROFILE HEADER */}

      <div className="profile-page-heading">

        <div className="profile-avatar-edit-wrap" ref={photoMenuRef}>

          <div className="profile-large-avatar">
            {photoPreview ? (
              <img src={photoPreview} alt="Profile" />
            ) : (
              <UserRound size={38} />
            )}
          </div>

          <button
            type="button"
            className="profile-edit-photo"
            aria-haspopup="menu"
            aria-expanded={isPhotoMenuOpen}
            onClick={() => setIsPhotoMenuOpen((open) => !open)}
          >
            Edit photo
          </button>

          {/* FLOATING PHOTO MENU */}

          {isPhotoMenuOpen && (
            <div className="profile-photo-popover" role="menu">

              <button
                type="button"
                role="menuitem"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileUp size={17} />
                <span>Upload Photo</span>
              </button>

              <button
                type="button"
                role="menuitem"
                className="remove-photo-option"
                disabled={!photoPreview}
                onClick={handleRemovePhoto}
              >
                <X size={17} />
                <span>Remove Photo</span>
              </button>

            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoChange}
            hidden
          />

        </div>

        <div className="profile-heading-info">
          <span>ACCOUNT PROFILE</span>
          <h1>{displayName}</h1>
          <p>{user?.email || "Not available"}</p>
        </div>

      </div>

      {message && (
        <p className="profile-photo-message" role="status">
          {message}
        </p>
      )}

      {/* PERSONAL INFORMATION */}

      <div className="profile-details-card">

        <div className="profile-card-heading">
          <h2>Personal Information</h2>
          <span>Read Only</span>
        </div>

        
        <div className="profile-details-grid">

          <div className="profile-detail-item">
            <label>Full Name</label>
            <strong>{displayName}</strong>
          </div>

          <div className="profile-detail-item">
            <label>Email Address</label>
            <strong>{user?.email || "Not available"}</strong>
          </div>

        </div>


      </div>

      {/* ACCOUNT INFORMATION */}

      <div className="profile-details-card">

        <div className="profile-card-heading">
          <h2>Account Information</h2>
          <span>Account Details</span>
        </div>

        <div className="profile-details-grid">

          <div className="profile-detail-item">
            <label>Account ID</label>
            <strong>{user?.uid || "Not available"}</strong>
          </div>

          <div className="profile-detail-item">
            <label>Workspace</label>
            <strong>EnergyLens</strong>
          </div>

          <div className="profile-detail-item">
            <label>Account Role</label>
            <strong>{role}</strong>
          </div>

          <div className="profile-detail-item">
            <label>Account Status</label>
            <strong className={user?.active ? "status-active" : "status-inactive"}>
              {user?.active ? "Active" : "Inactive"}
            </strong>
          </div>

        </div>

      </div>


    </section>
  );
}

