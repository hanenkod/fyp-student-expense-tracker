/**
 * Sidebar — left-edge navigation rail visible on every authenticated
 * page. Contains the four primary nav links (dashboard, transactions,
 * what-if, settings) and a profile link anchored to the bottom.
 */
import { NavLink } from "react-router-dom";

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
        <NavLink to="/dashboard" className="nav-item">
          <img src={homeIcon} alt="Home" />
        </NavLink>

        <NavLink to="/transactions" className="nav-item">
          <img src={cardIcon} alt="Transactions" />
        </NavLink>

        <NavLink to="/whatif" className="nav-item" title="What-If Planner">
          <img src={graphIcon} alt="What-If Planner" />
        </NavLink>

        <NavLink to="/settings" className="nav-item">
          <img src={settingsIcon} alt="Settings" />
        </NavLink>
      </nav>

      <div className="sidebar-bottom">
        <NavLink to="/profile" className="nav-item">
          <img src={profileIcon} alt="Profile" />
        </NavLink>
      </div>
    </aside>
  );
};