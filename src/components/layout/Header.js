// src/components/Header.js
import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Breadcrumb,
  Badge,
  Menu,
  Dropdown,
  Avatar,
  Button,
  List,
  Input,
  Tooltip,
  Drawer,
  Typography,
  Empty,
  Spin,
} from "antd";
import {
  SearchOutlined,
  UserOutlined,
  LogoutOutlined,
  CommentOutlined,
  BellOutlined,
} from "@ant-design/icons";
import { useHistory, useLocation, NavLink } from "react-router-dom";
import { api } from "../../api";

const { Text } = Typography;

function Header({
  placement,
  name,
  subName,
  onPress,
  handleSidenavColor,
  handleSidenavType,
  handleFixedNavbar,
}) {
  const history = useHistory();
  const location = useLocation();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const role = sessionStorage.getItem("role");
  const userIdStr = sessionStorage.getItem("userId"); // optional: used to detect personal notifications
  const userId = userIdStr ? Number(userIdStr) : null;

  const profilePath = React.useMemo(() => {
    if (!role) return "/profile";
    switch (role.toLowerCase()) {
      case "business":
        return "/businessProfile";
      case "investor":
        return "/investorProfile";
      case "admin":
      default:
        return "/profile";
    }
  }, [role]);

  useEffect(() => {
    // fetchUnreadCount();
    fetchRecentNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search || "");
    const qParam = (params.get("q") || "").toString();

    if (location.pathname === "/search-results") {
      setSearchQuery(qParam);
    } else {
      if (searchQuery) setSearchQuery("");
    }
  }, [location.pathname, location.search]);

  // Helper: format relative time
  const formatRelativeTime = (isoString) => {
    if (!isoString) return "";
    const then = new Date(isoString);
    if (isNaN(then.getTime())) return "";
    const now = Date.now();
    const diffSeconds = Math.floor((now - then.getTime()) / 1000);
    if (diffSeconds < 5) return "just now";
    if (diffSeconds < 60) return `${diffSeconds} sec${diffSeconds > 1 ? "s" : ""} ago`;
    const mins = Math.floor(diffSeconds / 60);
    if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;

    // older than a week -> show date; include year if not current year
    const optsSameYear = { month: "short", day: "numeric" };
    const optsWithYear = { month: "short", day: "numeric", year: "numeric" };
    const opts = then.getFullYear() === new Date().getFullYear() ? optsSameYear : optsWithYear;
    return then.toLocaleDateString(undefined, opts);
  };

  // Fetch recent notifications: personal + common merged & deduped
  const fetchRecentNotifications = async () => {
    setLoading(true);
    try {
      // request both endpoints in parallel and tolerate either failing
      const [personalRes, commonRes] = await Promise.allSettled([
        api.get("/notifications/getNotificationsOfLoggedInUser", { headers: authHeaders() }),
        api.get("/notifications/getAllNotifications", { headers: authHeaders() }),
      ]);

      const notificationsKey = "Notifications: ";

      const personalList =
        personalRes.status === "fulfilled" && Array.isArray(personalRes.value?.data?.[notificationsKey])
          ? personalRes.value.data[notificationsKey]
          : [];

      const commonList =
        commonRes.status === "fulfilled" && Array.isArray(commonRes.value?.data?.[notificationsKey])
          ? commonRes.value.data[notificationsKey]
          : [];

      // Merge: keep unique by id (personal & common combined)
      const combined = [...(personalList || []), ...(commonList || [])];

      // Use a Map to dedupe by id (preserve the first occurrence which will be personal ones if returned first)
      const map = new Map();
      for (const n of combined) {
        if (!n || typeof n.id === "undefined" || n.id === null) continue;
        // If same id exists, prefer the one with non-null receiverId (personal) or keep existing
        const existing = map.get(n.id);
        if (existing) {
          // if existing is common (receiverId null) and new one is personal -> replace
          if ((existing.receiverId === null || existing.receiverId === undefined) && (n.receiverId !== null && n.receiverId !== undefined)) {
            map.set(n.id, n);
          }
          // otherwise keep existing
        } else {
          map.set(n.id, n);
        }
      }

      // convert to array and normalize
      const normalized = Array.from(map.values()).map((n) => ({
        id: n.id,
        title: n.receiverType || "Notification",
        body: n.message || "",
        rawTime: n.createdAt,
        read: false,
        // flag useful for UI (true when notification targeted to specific receiverId)
        isPersonal: n.receiverId != null && n.receiverId !== undefined,
      }));

      // sort newest first by createdAt
      normalized.sort((a, b) => new Date(b.rawTime) - new Date(a.rawTime));

      setRecentNotifications(normalized.slice(0, 6));
    } catch (err) {
      // fallback: set empty
      setRecentNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // const fetchUnreadCount = async () => {
  //   try {
  //     const res = await api.get("/notifications/unreadCount", { headers: authHeaders() });
  //     setUnreadCount(typeof res.data?.count === "number" ? res.data.count : 0);
  //   } catch {
  //     // ignore
  //   }
  // };

  const authHeaders = () => {
    const t = sessionStorage.getItem("token");
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const openDrawer = async () => {
    setDrawerOpen(true);
    await fetchRecentNotifications();
    // await fetchUnreadCount();
  };

  const closeDrawer = () => setDrawerOpen(false);

  const onViewAll = () => {
    closeDrawer();
    history.push("/allNotifications");
  };

  const markAsRead = async (notifId) => {
    try {
      await api.post(`/notifications/${notifId}/mark-read`, {}, { headers: authHeaders() });
      setRecentNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      // silent
    }
  };

  const markAllRead = async () => {
    try {
      await api.post(`/notifications/mark-all-read`, {}, { headers: authHeaders() });
      setRecentNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      // silent
    }
  };

  // const onSearchChange = (e) => {
  //   const q = (e && e.target ? e.target.value : String(e || "")).toString();
  //   setSearchQuery(q);
  //   const base = "/search-results";
  //   const path = q && q.trim() ? `${base}?q=${encodeURIComponent(q.trim())}` : base;
  //   if (location.pathname === "/search-results") {
  //     history.replace(path);
  //   } else {
  //     history.push(path);
  //   }
  // };

  // const onClearSearch = () => {
  //   setSearchQuery("");
  //   if (location.pathname === "/search-results") {
  //     history.replace("/search-results");
  //   } else {
  //     history.push("/search-results");
  //   }
  // };

  const onSearchChange = (e) => {
  const q = (e && e.target ? e.target.value : String(e || "")).toString();
  setSearchQuery(q);

  const base = "/search-results";
  const path = q && q.trim() ? `${base}?q=${encodeURIComponent(q.trim())}` : base;

  if (location.pathname !== "/search-results") {
    // Save origin in history state so search page can return to it
    const from = location.pathname + (location.search || "");
    history.push(path, { from });
  } else {
    // already on search-results: preserve existing state.from if present, otherwise add a safe fallback
    const state = (location.state && location.state.from) ? location.state : { from: document.referrer || "/" };
    history.replace(path, state);
  }
};

const onClearSearch = () => {
  setSearchQuery("");

  if (location.pathname === "/search-results") {
    // try history state first, then fallback to referrer or history.back, then home
    const from = (location.state && location.state.from) || document.referrer || null;
    if (from) {
      history.replace(from);
      return;
    }
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    history.replace("/");
    return;
  }

  // not on search-results: just clear the input
};



  const navigateToProfileOrRoute = (path) => {
    try {
      history.push(path);
    } catch {
      window.location.href = path;
    }
  };

  return (
    <>
      <Row gutter={[24, 0]}>
        <Col span={24} md={6}>
          <Breadcrumb>
            {/* <Breadcrumb.Item>
              <NavLink to="/">Pages</NavLink>
            </Breadcrumb.Item> */}
            <Breadcrumb.Item style={{ textTransform: "capitalize" }}>
              {name ? name.replace("/", "") : ""}
            </Breadcrumb.Item>
          </Breadcrumb>
          <div className="ant-page-header-heading">
            <span className="ant-page-header-heading-title" style={{ textTransform: "capitalize" }}>
              {subName ? subName.replace("/", "") : ""}
            </span>
          </div>
        </Col>

        <Col span={24} md={18} className="header-control" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Button type="link" className="sidebar-toggler" onClick={() => onPress?.()}>
            <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
              <path d="M16 132h416c8.837 0 16-7.163 16-16V76c0-8.837-7.163-16-16-16H16C7.163 60 0 67.163 0 76v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16z"></path>
            </svg>
          </Button>

          <Dropdown
            overlay={
              <Menu>
                <Menu.Item key="profile" icon={<UserOutlined />} onClick={() => history.push(profilePath)}>
                  Your Profile
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item key="signout" icon={<LogoutOutlined />} onClick={() => {
                  sessionStorage.clear();
                  history.push("/sign-in");
                }}>
                  Sign Out
                </Menu.Item>
              </Menu>
            }
            trigger={["click"]}
          >
            <span style={{ cursor: "pointer", display: "inline-flex", alignItems: "center" }}>
              <Avatar icon={<UserOutlined />} />
            </span>
          </Dropdown>

          <Tooltip title="Notifications">
            <Badge count={unreadCount} size="small" offset={[0, 2]}>
              <Button
                size="large"
                type="link"
                icon={<BellOutlined style={{ fontSize: 18 }} />}
                onClick={openDrawer}
              />
            </Badge>
          </Tooltip>

          <Tooltip title="Message">
            <Button
              size="large"
              type="link"
              onClick={() => history.push("/listOfInvestorAndBusiness")}
              icon={<CommentOutlined style={{ fontSize: 18, marginRight: "-10px" }} />}
            />
          </Tooltip>

          <div
            style={{
              position: "relative",
              minWidth: 0,
              flex: "1 1 240px",
              maxWidth: 240,
            }}
          >
            <Input
              value={searchQuery}
              onChange={onSearchChange}
              // placeholder="Type here..."
              placeholder="Search"
              prefix={<SearchOutlined />}
              allowClear
              onClear={onClearSearch}
              size="small"
              style={{
                width: "100%",
                minWidth: 0,
                boxSizing: "border-box",
              }}
              className="header-search-input"
            />
          </div>

        </Col>
      </Row>

      <Drawer
        title="Notifications"
        placement="right"
        width={380}
        onClose={closeDrawer}
        visible={drawerOpen}
        bodyStyle={{ padding: 12 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <Text strong>Recent</Text>
          {/* <div>
            <Button type="link" size="small" onClick={markAllRead}>Mark all read</Button>
          </div> */}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 20 }}>
            <Spin />
          </div>
        ) : recentNotifications.length === 0 ? (
          <Empty description="No notifications" />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={recentNotifications}
            renderItem={(item) => (
              <List.Item
                style={{
                  padding: "8px 4px",
                  background: item.read ? "transparent" : "rgba(24,144,255,0.04)",
                  borderRadius: 6,
                  marginBottom: 8,
                  cursor: item.link ? "pointer" : "default",
                }}
                onClick={() => {
                  if (item.link) {
                    closeDrawer();
                    navigateToProfileOrRoute(item.link);
                  }
                }}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      size="small"
                      style={{ background: item.isPersonal ? "#FFF7E6" : "#E6F7FF", color: item.isPersonal ? "#FA8C16" : "#1890ff" }}
                    >
                      {(item.title || "N").slice(0, 1)}
                    </Avatar>
                  }
                  // title={
                  //   <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  //     <span style={{ fontWeight: item.read ? 500 : 700 }}>{item.title}</span>
                  //     <span style={{ fontSize: 11, color: "rgba(0,0,0,0.45)" }}>
                  //       {item.isPersonal ? "Personal" : "Common"}
                  //     </span>
                  //   </div>
                  // }
                  description={
                    <div>
                      <div style={{ fontSize: 13, color: "rgba(0,0,0,0.85)", whiteSpace: "pre-wrap" }}>
                        {item.body}
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(0,0,0,0.45)", marginTop: 6 }}>
                        {formatRelativeTime(item.rawTime)}
                      </div>
                    </div>
                  }
                />
                {/* <div style={{ minWidth: 40, textAlign: "right" }}>
                  {!item.read && (
                    <Button size="small" type="link" onClick={() => markAsRead(item.id)}>
                      Mark
                    </Button>
                  )}
                </div> */}
              </List.Item>
            )}
          />
        )}

        <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
          <Button type="link" onClick={onViewAll}>View all</Button>
        </div>
      </Drawer>

      <style>{`
@media (max-width: 576px) {
  .header-control { gap: 6px; }
  .header-search-input .ant-input {
    width: 140px !important;
  }
}
`}</style>
    </>
  );
}

export default Header;
