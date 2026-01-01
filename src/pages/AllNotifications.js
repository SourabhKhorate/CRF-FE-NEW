// src/pages/AllNotifications.js
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Card,
  List,
  Avatar,
  Button,
  Empty,
  Pagination,
  Spin,
  Typography,
  Row,
  Col,
  message,
  Tooltip,
} from "antd";
import { UserOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { api } from "../api"; // adjust if your api path differs
import { useHistory } from "react-router-dom";

const { Title } = Typography;

/**
 * AllNotifications (simplified)
 * - Fetches notifications from:
 *    - /notifications/getNotificationsOfLoggedInUser
 *    - /notifications/getAllNotifications
 * - Merges, sorts (newest first), dedupes by id (if present)
 * - Shows friendly relative time ("2 sec ago", "6 min ago", "Nov 23")
 * - Client-side pagination
 *
 * Note: removed "mark as read" and "mark all read" features per request.
 */

export default function AllNotifications() {
  const history = useHistory();

  const [mergedNotifications, setMergedNotifications] = useState([]); // full merged list
  const [loading, setLoading] = useState(false);

  // pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // helper: auth headers
  const authHeaders = useCallback(() => {
    const t = sessionStorage.getItem("token");
    return t ? { Authorization: `Bearer ${t}` } : {};
  }, []);

  // helper to extract array from various possible response shapes
  const extractNotificationsFromResponse = (res) => {
    if (!res || !res.data) return [];
    const d = res.data;
    if (Array.isArray(d["Notifications: "])) return d["Notifications: "];
    if (Array.isArray(d.Notifications)) return d.Notifications;
    if (Array.isArray(d.notifications)) return d.notifications;
    if (Array.isArray(d)) return d;
    return [];
  };

  // fetch both endpoints and merge
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const [userRes, allRes] = await Promise.allSettled([
        api.get("/notifications/getNotificationsOfLoggedInUser", { headers: authHeaders() }),
        api.get("/notifications/getAllNotifications", { headers: authHeaders() }),
      ]);

      const listA = userRes.status === "fulfilled" ? extractNotificationsFromResponse(userRes.value) : [];
      const listB = allRes.status === "fulfilled" ? extractNotificationsFromResponse(allRes.value) : [];

      const combined = [...listA, ...listB];

      const normalized = combined
        .map((n) => {
          if (!n) return null;
          return {
            id: typeof n.id !== "undefined" ? n.id : null,
            body: n.message || n.body || "",
            createdAt: n.createdAt || n.created_at || null,
            _raw: n,
          };
        })
        .filter(Boolean);

      const seen = new Map();
      const deduped = [];
      for (const item of normalized) {
        const key = item.id !== null ? `id:${item.id}` : `hash:${item.body}::${item.createdAt}`;
        if (!seen.has(key)) {
          seen.set(key, true);
          deduped.push(item);
        }
      }

      deduped.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        if (a.createdAt) return -1;
        if (b.createdAt) return 1;
        return 0;
      });

      setMergedNotifications(deduped);
      setPage(1);
    } catch (err) {
      console.error("fetchNotifications error:", err);
      message.error("Could not load notifications.");
      setMergedNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // friendly relative time
  const timeAgo = (isoString) => {
    if (!isoString) return "";
    const then = new Date(isoString);
    if (isNaN(then)) return isoString;
    const diffSec = Math.floor((Date.now() - then.getTime()) / 1000);
    if (diffSec < 0) return "just now";
    if (diffSec < 60) return `${diffSec} sec ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hr${diffHr > 1 ? "s" : ""} ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay <= 7) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
    return then.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  // paginated view (client-side)
  const pagedNotifications = useMemo(() => {
    const start = (page - 1) * pageSize;
    return mergedNotifications.slice(start, start + pageSize);
  }, [mergedNotifications, page, pageSize]);

  const total = mergedNotifications.length;

  const handlePageChange = (p, ps) => {
    setPage(p);
    if (ps && ps !== pageSize) {
      setPageSize(ps);
      setPage(1);
    }
  };

  const openRelated = (item) => {
    if (item && item._raw && item._raw.link) {
      history.push(item._raw.link);
    }
  };

  return (
    <Card bodyStyle={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Title level={3}>All Notifications</Title>
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={fetchNotifications} disabled={loading}>
            Refresh
          </Button>
          <Button
            onClick={() => history.goBack()}
            shape="circle"
            className="cta-btn"
            style={{
              width: 40,
              height: 40,
              padding: 0,
              // background: "#1890ff",
              border: "none",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
            icon={<ArrowLeftOutlined style={{ fontSize: 18, color: "#fff" }} />}
          />
        </div>
      </div>

      <Row gutter={[16, 8]} align="middle" style={{ marginBottom: 12 }}>
        <Col xs={24} sm={12} style={{ display: "flex", alignItems: "center" }}>
          <div style={{ fontSize: 14, color: "rgba(0,0,0,0.65)" }}>
            <strong>{mergedNotifications.length}</strong> notifications
          </div>
        </Col>

        <Col
          xs={24}
          sm={12}
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            marginTop: 8,
          }}
        >
          {/* reserved for additional controls */}
        </Col>
      </Row>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin />
        </div>
      ) : mergedNotifications.length === 0 ? (
        <Empty description="No notifications" />
      ) : (
        <>
          <List
            itemLayout="horizontal"
            dataSource={pagedNotifications}
            renderItem={(item) => (
              <List.Item
                style={{
                  background: "transparent",
                  borderRadius: 6,
                  marginBottom: 8,
                  padding: 12,
                  cursor: item._raw && item._raw.link ? "pointer" : "default",
                }}
                onClick={() => openRelated(item)}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar size={40} icon={<UserOutlined />} style={{ background: "#E6F7FF", color: "#1890ff" }}>
                      {/* keep avatar minimal; using first char of message */}
                      {(item.body || "N").slice(0, 1)}
                    </Avatar>
                  }
                  title={<div style={{ fontWeight: 600 }}>{item.body}</div>}
                  description={
                    item.createdAt ? (
                      <div style={{ fontSize: 12, color: "rgba(0,0,0,0.45)" }}>
                        <Tooltip title={new Date(item.createdAt).toLocaleString()}>
                          <span>{timeAgo(item.createdAt)}</span>
                        </Tooltip>
                      </div>
                    ) : null
                  }
                />
              </List.Item>
            )}
          />

          <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              onChange={handlePageChange}
              showSizeChanger
              onShowSizeChange={handlePageChange}
              pageSizeOptions={["5", "10", "20", "50"]}
              showTotal={(t) => `Total ${t} items`}
            />
          </div>
        </>
      )}
    </Card>
  );
}
