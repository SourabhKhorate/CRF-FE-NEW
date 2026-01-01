import React, { useState, useEffect } from "react";
import { Menu } from "antd";
import { NavLink, useLocation, useHistory } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import {
  DashboardOutlined,
  FundOutlined,
  TableOutlined,
  UserOutlined,
  LoginOutlined,
  UserAddOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  InfoCircleOutlined,
  HistoryOutlined,
  AreaChartOutlined,
  DollarOutlined,
  ProfileOutlined,
  BankOutlined,
  ShopOutlined,
  VerifiedOutlined,
  TeamOutlined,
  SolutionOutlined,
  UserSwitchOutlined,
  UserDeleteOutlined,
  SafetyCertificateOutlined,
  StopOutlined,
} from "@ant-design/icons";

function Sidenav({ color }) {
  const { pathname } = useLocation();
  const page = pathname.replace("/", "");

  const role = sessionStorage.getItem("role");

  const { SubMenu } = Menu;

    // inside your component
const history = useHistory();

  // mapping of route page -> menu key
  const pageKeyMap = {
    // business / investor / admin pages you had
    allInvestments: "1",
    businessDashboard: "2",
    businessInformation: "3",
    fundraising: "4",
    businessInvestments: "5",
    previousVentures: "6",
    investorList: "7",
    investorDashboard: "8",
    myInvestment: "9",
    investorFundraising: "10",
    myPledgesList: "11",
    // company submenu children
    listedCompany: "12",
    verifiedCompanies: "13",
    unVerifiedCompanies: "14",
    // investor submenu children
    allInvestors: "15",
    verifiedInvestors: "16",
    unVerifiedInvestors: "17",
  };

  const investorPages = ["allInvestors", "verifiedInvestors", "unVerifiedInvestors"];
  const companyPages = ["listedCompany", "verifiedCompanies", "unVerifiedCompanies"];

  const investorChildKeys = ["15", "16", "17"];
  const companyChildKeys = ["12", "13", "14"];

  const [openKeys, setOpenKeys] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);

  // sync selection & open state with current path
  useEffect(() => {
    const selected = pageKeyMap[page];
    setSelectedKeys(selected ? [selected] : []);

    if (investorPages.includes(page)) {
      setOpenKeys(["investors"]);
    } else if (companyPages.includes(page)) {
      setOpenKeys(["companies"]);
    } else {
      setOpenKeys([]);
    }
  }, [page]);

  // allow only one submenu open at a time
  const handleOpenChange = (keys) => {
    if (!keys || keys.length === 0) {
      setOpenKeys([]);
      return;
    }
    setOpenKeys([keys[keys.length - 1]]);
  };

  // clicking a menu item sets selection; if non-submenu top-level clicked, close submenus
  const handleClick = ({ key }) => {
    setSelectedKeys([key]);

    // if a top-level non-company/investor item clicked, close submenus
    if (!investorChildKeys.includes(key) && !companyChildKeys.includes(key)) {
      setOpenKeys([]);
    }
  };

  const handleBrandClick = () => {
  const role = sessionStorage.getItem("role");
  switch (role) {
    case "ADMIN":
      history.push("/allInvestments");
      break;
    case "BUSINESS":
      history.push("/businessDashboard");
      break;
    case "INVESTOR":
      history.push("/investorDashboard");
      break;
    default:
      history.push("/sign-in");
  }
};


  return (
    <>
      {/* <div className="brand" style={{ margin: "20px 0 0 20px", }}>
        <img src={logo} alt="" />
        <span>Crowd Funding</span>
      </div> */}

      <div
        className="brand"
        role="button"                /* accessibility: treat as button */
        tabIndex={0}                 /* focusable via keyboard */
        onClick={handleBrandClick}
        onKeyDown={(e) => {
          // allow Enter or Space to activate the div
          if (e.key === "Enter" || e.key === " ") handleBrandClick();
        }}
        style={{
          margin: "20px 0 0 20px",
          cursor: "pointer"          /* visual affordance */
        }}
      >
        <img src={logo} alt="" />
        <span>Crowd Funding</span>
      </div>
      
      <hr style={{ borderTop: "1px solid #000" }} />
      <Menu
        theme="light"
        mode="inline"
        className="sidenav-menu"
        selectedKeys={selectedKeys}
        openKeys={openKeys}
        onOpenChange={handleOpenChange}
        onClick={handleClick}
      >

        {/*
          Keep every menu item and role logic intact — only grouping Company & Investors into submenus.
        */}

        {role === "ADMIN" && (
          <Menu.Item key="1">
            <NavLink to="/allInvestments" exact>
              <span className="icon" style={{ background: page === "allInvestments" ? color : "" }}>
                <BankOutlined />
              </span>
              <span className="label">All Handshakes</span>
            </NavLink>
          </Menu.Item>
        )}

        {role === "BUSINESS" && (
          <Menu.Item key="2">
            <NavLink to="/businessDashboard" exact>
              <span className="icon" style={{ background: page === "businessDashboard" ? color : "" }}>
                <AppstoreOutlined />
              </span>
              <span className="label">Business Dashboard</span>
            </NavLink>
          </Menu.Item>
        )}
        {role === "BUSINESS" && (
          <Menu.Item key="3">
            <NavLink to="/businessInformation" exact>
              <span className="icon" style={{ background: page === "businessInformation" ? color : "" }}>
                <InfoCircleOutlined />
              </span>
              <span className="label">Manage Profile</span>
            </NavLink>
          </Menu.Item>
        )}

        {role === "BUSINESS" && (
          <Menu.Item key="4">
            <NavLink to="/fundraising" exact>
              <span className="icon" style={{ background: page === "fundraising" ? color : "" }}>
                <FundOutlined />
              </span>
              <span className="label">Current Fund Raising</span>
            </NavLink>
          </Menu.Item>
        )}

        {role === "BUSINESS" && (
          <Menu.Item key="5">
            <NavLink to="/businessInvestments" exact>
              <span className="icon" style={{ background: page === "businessInvestments" ? color : "" }}>
                <ShopOutlined />
              </span>
              <span className="label">Business Investments</span>
            </NavLink>
          </Menu.Item>
        )}

        {role === "BUSINESS" && (
          <Menu.Item key="6">
            <NavLink to="/previousVentures" exact>
              <span className="icon" style={{ background: page === "previousVentures" ? color : "" }}>
                <HistoryOutlined />
              </span>
              <span className="label">Previous Ventures</span>
            </NavLink>
          </Menu.Item>
        )}

        {role === "BUSINESS" && (
          <Menu.Item key="7">
            <NavLink to="/investorList" exact>
              <span className="icon" style={{ background: page === "investorList" ? color : "" }}>
                <TeamOutlined />
              </span>
              <span className="label">Investors List</span>
            </NavLink>
          </Menu.Item>
        )}

        {role === "INVESTOR" && (
          <Menu.Item key="8">
            <NavLink to="/investorDashboard" exact>
              <span className="icon" style={{ background: page === "investorDashboard" ? color : "" }}>
                <AreaChartOutlined />
              </span>
              <span className="label">Investor Dashboard</span>
            </NavLink>
          </Menu.Item>
        )}

        {role === "INVESTOR" && (
          <Menu.Item key="9">
            <NavLink to="/myInvestment" exact>
              <span className="icon" style={{ background: page === "myInvestment" ? color : "" }}>
                <DollarOutlined />
              </span>
              <span className="label">My Investment</span>
            </NavLink>
          </Menu.Item>
        )}

        {role === "INVESTOR" && (
          <Menu.Item key="10">
            <NavLink to="/investorFundraising" exact>
              <span className="icon" style={{ background: page === "investorFundraising" ? color : "" }}>
                <VerifiedOutlined />
              </span>
              <span className="label">Fundraising</span>
            </NavLink>
          </Menu.Item>
        )}

        {role === "INVESTOR" && (
          <Menu.Item key="11">
            <NavLink to="/myPledgesList" exact>
              <span className="icon" style={{ background: page === "myPledgesList" ? color : "" }}>
                <SolutionOutlined />
              </span>
              <span className="label">My Pledges</span>
            </NavLink>
          </Menu.Item>
        )}

        {/* Companies Submenu */}
        {(role === "INVESTOR" || role === "ADMIN") && (
          <SubMenu
            key="companies"
            title={
              <span>
                <span className="icon" style={{ background: companyPages.includes(page) ? color : "" }}>
                  <UnorderedListOutlined />
                </span>
                <span className="label">Companies</span>
              </span>
            }
          >
            <Menu.Item key="12">
              <NavLink to="/listedCompany" exact>
                {/* small disc instead of icon for submenu child */}
                <span
                  className="disc"
                  style={{ background: page === "listedCompany" ? color : undefined }}
                />
                <span className="label">Listed Companies</span>
              </NavLink>
            </Menu.Item>

            <Menu.Item key="13">
              <NavLink to="/verifiedCompanies" exact>
                <span
                  className="disc"
                  style={{ background: page === "verifiedCompanies" ? color : undefined }}
                />
                <span className="label">Verified Companies</span>
              </NavLink>
            </Menu.Item>

            {/* {role === "ADMIN" && (
              <Menu.Item key="14">
                <NavLink to="/unVerifiedCompanies" exact>
                  <span
                    className="disc"
                    style={{ background: page === "unVerifiedCompanies" ? color : undefined }}
                  />
                  <span className="label">Un-Verified Companies</span>
                </NavLink>
              </Menu.Item>
            )} */}
          </SubMenu>
        )}

        {/* Investors Submenu (ADMIN only) */}
        {role === "ADMIN" && (
          <SubMenu
            key="investors"
            title={
              <span>
                <span className="icon" style={{ background: investorPages.includes(page) ? color : "" }}>
                  <ProfileOutlined />
                </span>
                <span className="label">Investors</span>
              </span>
            }
          >
            <Menu.Item key="15">
              <NavLink to="/allInvestors" exact>
                <span className="disc" style={{ background: page === "allInvestors" ? color : undefined }} />
                <span className="label">All Investors</span>
              </NavLink>
            </Menu.Item>

            <Menu.Item key="16">
              <NavLink to="/verifiedInvestors" exact>
                <span className="disc" style={{ background: page === "verifiedInvestors" ? color : undefined }} />
                <span className="label">Verified Investors</span>
              </NavLink>
            </Menu.Item>

            <Menu.Item key="17">
              <NavLink to="/unVerifiedInvestors" exact>
                <span className="disc" style={{ background: page === "unVerifiedInvestors" ? color : undefined }} />
                <span className="label">Un-Verified Investors</span>
              </NavLink>
            </Menu.Item>
          </SubMenu>
        )}
      </Menu>
      {/* make sidebar labels bold */}
      <style>{`
  .sidenav-menu .label { font-weight: 600 !important; }
`}</style>


    </>
  );
}

export default Sidenav;
