import homeIcon from "../assets/icons/material-symbols_home-rounded.svg";
import cardIcon from "../assets/icons/solar_card-bold.svg";
import graphIcon from "../assets/icons/solar_graph-bold.svg";
import settingsIcon from "../assets/icons/material-symbols_settings.svg";
import profileIcon from "../assets/icons/healthicons_ui-user-profile.svg";

export const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="brand">POCKE</div>

      <nav className="nav">
        <img src={homeIcon} alt="Home" className="nav-icon" />
        <img src={cardIcon} alt="Cards" className="nav-icon" />
        <img src={graphIcon} alt="Analytics" className="nav-icon" />
        <img src={settingsIcon} alt="Settings" className="nav-icon" />
      </nav>

      <div className="sidebar-bottom">
        <img src={profileIcon} alt="Profile" className="nav-icon" />
      </div>
    </aside>
  );
};
