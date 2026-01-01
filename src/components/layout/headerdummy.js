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
  MessageOutlined,
  BellOutlined,
} from "@ant-design/icons";
import { useHistory, NavLink } from "react-router-dom";
import { api } from "../../api";

const { Title, Text } = Typography;

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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const role = sessionStorage.getItem("role");
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
    // fetch unread count on mount
    fetchUnreadCount();
    // fetch recent notifications in background for Drawer quick open
    fetchRecentNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

const fetchRecentNotifications = async () => {
  try {
    setLoading(true);
    const res = await api.get("/notifications/getNotificationsOfLoggedInUser", {
      headers: authHeaders(),
    });

    // Match your API key exactly (including space & colon)
    const notificationsKey = "Notifications: ";
    const list = Array.isArray(res.data?.[notificationsKey])
      ? res.data[notificationsKey]
      : [];

    // Map backend field names to frontend expectations
    const mappedList = list.map((n) => ({
      id: n.id,
      title: n.receiverType || "Notification",
      body: n.message,
      time: n.createdAt,
      read: false, // backend doesn’t send read status
    }));

    setRecentNotifications(mappedList.slice(0, 6));
  } catch (err) {
    setRecentNotifications([]);
  } finally {
    setLoading(false);
  }
};


  const fetchUnreadCount = async () => {
    try {
      const res = await api.get("/notifications/unreadCount", { headers: authHeaders() });
      setUnreadCount(typeof res.data?.count === "number" ? res.data.count : 0);
    } catch {
      // ignore
    }
  };

  const authHeaders = () => {
    const t = sessionStorage.getItem("token");
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const openDrawer = async () => {
    setDrawerOpen(true);
    // refresh when opening
    await fetchRecentNotifications();
    await fetchUnreadCount();
  };

  const closeDrawer = () => setDrawerOpen(false);

  const onViewAll = () => {
    closeDrawer();
    history.push("/allNotifications");
  };

  const markAsRead = async (notifId) => {
    try {
      await api.post(`/notifications/${notifId}/mark-read`, {}, { headers: authHeaders() });
      // update locally
      setRecentNotifications((prev) => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      // silent
    }
  };

  const markAllRead = async () => {
    try {
      await api.post(`/notifications/mark-all-read`, {}, { headers: authHeaders() });
      setRecentNotifications((prev) => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      // silent
    }
  };

  return (
    <>
      <Row gutter={[24, 0]}>
        <Col span={24} md={6}>
          <Breadcrumb>
            <Breadcrumb.Item>
              <NavLink to="/">Pages</NavLink>
            </Breadcrumb.Item>
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
            {/* hamburger icon SVG as in your original */}
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

          {/* Notification bell wrapped with Badge and Drawer */}
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

          {/* Chat Icon Button */}
          <Button
            size="large"
            type="link"
            onClick={() => history.push("/listOfInvestorAndBusiness")}
            icon={<MessageOutlined style={{ fontSize: "18px" }} />}
          />

          <Input className="header-search" placeholder="Type here..." prefix={<SearchOutlined />} style={{ width: 240 }} />
        </Col>
      </Row>

      {/* Drawer for quick notifications preview */}
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
          <div>
            {/* <Button type="link" onClick={markAllRead} disabled={recentNotifications.length === 0}>
              Mark all read
            </Button> */}
          </div>
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
                style={{ padding: "8px 4px", background: item.read ? "transparent" : "rgba(24,144,255,0.04)", borderRadius: 6, marginBottom: 8 }}
                // actions={[
                //   !item.read && <Button type="link" onClick={() => markAsRead(item.id)}>Mark read</Button>
                // ]}
                onClick={() => {
                  // optional: navigate to related resource
                  if (item.link) {
                    closeDrawer();
                    history.push(item.link);
                  }
                }}
              >
                <List.Item.Meta
                  avatar={<Avatar size="small" style={{ background: "#E6F7FF", color: "#1890ff" }}>{(item.title || "N").slice(0, 1)}</Avatar>}
                  title={<span style={{ fontWeight: item.read ? 500 : 700 }}>{item.title}</span>}
                  description={<div style={{ fontSize: 13, color: "rgba(0,0,0,0.65)" }}>{item.body}</div>}
                />
                <div style={{ textAlign: "right", minWidth: 72 }}>
                  <div style={{ fontSize: 11, color: "rgba(0,0,0,0.45)" }}>
                    {item.time ? new Date(item.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}

        <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
          <Button type="link" onClick={onViewAll}>View all</Button>
        </div>
      </Drawer>
    </>
  );
}

export default Header;
