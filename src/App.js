// src/App.js

import { Switch, Route, Redirect } from "react-router-dom";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import Main from "./components/layout/Main";
import Home from "./pages/Home";
import Tables from "./pages/Tables";
import Billing from "./pages/Billing";
import Rtl from "./pages/Rtl";
import Profile from "./pages/Profile";
import Fundraising from "./pages/Fundraising"
import CreateFund from "./pages/CreateFund"
import FundDetailsPage from "./pages/FundDetailsPage"
import ListedCompany from "./pages/ListedCompany"
import VerifiedCompanies from "./pages/VerifiedCompanies"
import BusinessDashboard from "./pages/BusinessDashboard"
import BusinessInformation from "./pages/BusinessInformation"
import BusinessProfile from "./pages/BusinessProfile"
import EditBusinessProfile from "./pages/EditBusinessProfile"
import BusinessAddOwnerInformation from "./pages/BusinessAddOwnerInformation"
import BusinessEditOwnerInformation from "./pages/BusinessEditOwnerInformation"
import BusinessDocuments from "./pages/BusinessDocuments"
import EditBusinessDocuments from "./pages/EditBusinessDocuments"
import LegalDocuments from "./pages/LegalDocuments"
import EditFund from "./pages/EditFund"
import InvestorDashboard from "./pages/InvestorDashboard"
import InvestorProfile from "./pages/InvestorProfile"
import EditInvestorProfile from "./pages/EditInvestorProfile"
import InvestorFundraising from "./pages/InvestorFundraising"
import MyInvestment from "./pages/MyInvestment"
import TotalInvestment from "./pages/TotalInvestment"
import PreviousVentures from "./pages/PreviousVentures"
import AllInvestments from "./pages/AllInvestments"
import ViewPreviousVenture from "./pages/ViewPreviousVenture"
import BusinessInvestments from "./pages/BusinessInvestments"
import InvestorList from "./pages/InvestorList"
import BusinessOwnersList from "./pages/BusinessOwnersList"
import BusinessAllOwnersList from "./pages/BusinessAllOwnersList"
import OwnerProfile from "./pages/OwnerProfile"
import AddPledge from "./pages/AddPledge"
import FundPledgesList from "./pages/FundPledgesList"
import MyPledgesList from "./pages/MyPledgesList"
import EditPledge from "./pages/EditPledge"
import ViewPledge from "./pages/ViewPledge"
import AddInvestment from "./pages/AddInvestment"
import ApprovedInvestment from "./pages/ApprovedInvestment"
import PendingInvestment from "./pages/PendingInvestment"
import UnVerifiedCompanies from "./pages/UnVerifiedCompanies"
import AllInvestors from "./pages/AllInvestors"
import VerifiedInvestors from "./pages/VerifiedInvestors"
import UnVerifiedInvestors from "./pages/UnVerifiedInvestors"
import ListOfInvestorAndBusiness from "./pages/ListOfInvestorAndBusiness"
import ChatInterface from "./pages/ChatInterface"
import AllNotifications from "./pages/AllNotifications"
import GlobalSearchResults from "./pages/GlobalSearchResults";
import "antd/dist/antd.css";
import "./assets/styles/main.css";
import "./assets/styles/responsive.css";
import "./pages/css/FundRasing.css"

function isAuthenticated() {
  const token = sessionStorage.getItem("token");
  const expiry = sessionStorage.getItem("tokenExpiry");
  if (!token || !expiry) return false;

  if (Date.now() > parseInt(expiry, 10)) {
    // session expired: clean up
    sessionStorage.clear();
    return false;
  }
  return true;
}

function RoleRedirect() {
  const role = sessionStorage.getItem("role");
  switch (role) {
    case "ROLE_ADMIN":
      return <Redirect to="/allInvestments" />;
    case "ROLE_BUSINESS":
      return <Redirect to="/businessDashboard" />;
    case "ROLE_INVESTOR":
      return <Redirect to="/investorDashboard" />;
    default:
      return <Redirect to="/sign-in" />;
  }
}

function App() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/sign-up" exact component={SignUp} />
      <Route path="/sign-in" exact component={SignIn} />

      {/* Protected layout for everything else */}
      <Route
        path="/"
        render={({ location }) => {
          if (!isAuthenticated()) {
            // If not logged in, send them to /sign-in (preserve the original target in state if you like)
            return <Redirect to={{ pathname: "/sign-in", state: { from: location } }} />;
          }

          // If logged in, wrap all sub-pages in the Main layout
          return (
            <Main>
              <Switch>
                <Route exact path="/dashboard" component={Home} />
                <Route exact path="/tables" component={Tables} />
                <Route exact path="/billing" component={Billing} />
                <Route exact path="/rtl" component={Rtl} />
                <Route exact path="/profile" component={Profile} />
                <Route exact path="/fundraising" component={Fundraising} />
                <Route exact path="/createFund" component={CreateFund} />
                <Route exact path="/fundraising/:id" component={FundDetailsPage} />
                <Route exact path="/listedCompany" component={ListedCompany} />
                <Route exact path="/verifiedCompanies" component={VerifiedCompanies} />
                <Route exact path="/businessDashboard" component={BusinessDashboard} />
                <Route exact path="/businessInformation" component={BusinessInformation} />
                <Route exact path="/businessAddOwnerInformation" component={BusinessAddOwnerInformation} />
                <Route exact path="/businessEditOwnerInformation/:ownerId" component={BusinessEditOwnerInformation} />
                <Route exact path="/businessProfile" component={BusinessProfile} />
                <Route exact path="/editBusinessProfile" component={EditBusinessProfile} />
                <Route exact path="/businessDocuments" component={BusinessDocuments} />
                <Route exact path="/editBusinessDocuments" component={EditBusinessDocuments} />
                <Route exact path="/legalDocuments" component={LegalDocuments} />
                <Route exact path="/editFund/:id" component={EditFund} />
                <Route exact path="/previousVentures" component={PreviousVentures} />
                <Route exact path="/allInvestments" component={AllInvestments} />
                <Route exact path="/viewPreviousVenture/:id" component={ViewPreviousVenture} />
                <Route exact path="/investorDashboard" component={InvestorDashboard} />
                <Route exact path="/investorProfile" component={InvestorProfile} />
                <Route exact path="/editInvestorProfile" component={EditInvestorProfile} />
                <Route exact path="/investorFundraising" component={InvestorFundraising} />
                <Route exact path="/myInvestment" component={MyInvestment} />
                <Route exact path="/totalInvestment" component={TotalInvestment} />
                <Route exact path="/businessInvestments" component={BusinessInvestments} />
                <Route exact path="/investorList" component={InvestorList} />
                <Route exact path="/businessOwnersList" component={BusinessOwnersList} />
                <Route exact path="/businessAllOwnersList/:businessId" component={BusinessAllOwnersList} />
                <Route exact path="/owners/:ownerId" component={OwnerProfile} />
                <Route path="/addPledge/:fundId" component={AddPledge} />
                <Route path="/fundPledges/:fundId" component={FundPledgesList} />
                <Route path="/myPledgesList" component={MyPledgesList} />
                <Route path="/editPledge/:pledgeId" component={EditPledge} />
                <Route path="/viewPledge/:pledgeId" component={ViewPledge} />
                <Route path="/addInvestment/:pledgeId" component={AddInvestment} />
                <Route path="/approvedInvestment" component={ApprovedInvestment} />
                <Route path="/pendingInvestment" component={PendingInvestment} />
                <Route path="/unVerifiedCompanies" component={UnVerifiedCompanies} />
                <Route path="/allInvestors" component={AllInvestors} />
                <Route path="/verifiedInvestors" component={VerifiedInvestors} />
                <Route path="/unVerifiedInvestors" component={UnVerifiedInvestors} />
                <Route path="/listOfInvestorAndBusiness" component={ListOfInvestorAndBusiness} />
                <Route path="/chatInterface" component={ChatInterface} />
                <Route path="/allNotifications" component={AllNotifications} />
                <Route path="/search-results" component={GlobalSearchResults} />
                {/* Redirect any other authenticated URL to /dashboard */}
                {/* <Redirect to="/dashboard" /> */}
                {/* Catch-all: goes to correct dashboard (or login) */}
                <Route render={() => <RoleRedirect />} />
              </Switch>
            </Main>
          );
        }}
      />
    </Switch>
  );
}

export default App;
