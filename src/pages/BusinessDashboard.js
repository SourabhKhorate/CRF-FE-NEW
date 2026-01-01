// src/pages/BusinessDashboard.js
import React, { useState, useEffect } from "react";
import { Row, Col, Card, Typography, Button, Spin } from "antd";
import { useHistory } from "react-router-dom";

// Import your images
import imgRaise from "../assets/images/business-images/raise-fund.jpg";
import imgPrevious from "../assets/images/business-images/previous-venture.jpg";
import imgCurrent from "../assets/images/business-images/current-fund.jpg";
import imgInfo from "../assets/images/business-images/business-info.jpg";
import imgLegal from "../assets/images/business-images/legal-docs.jpg";

const { Text } = Typography;

const tiles = [
  {
    key: "current",
    title: "Current Fund Raising",
    desc: "Manage your ongoing fundraising campaign.",
    button: "View",
    route: "/fundraising",
    image: imgCurrent,
  },
  {
    key: "raise",
    title: "Raise Fund",
    desc: "Start a new fundraising campaign.",
    button: "Raise",
    route: "/createFund",
    image: imgRaise,
  },
  {
    key: "previous",
    title: "Previous Venture",
    desc: "View details of your previous fundraising efforts.",
    button: "View",
    route: "/previousVentures",
    image: imgPrevious,
  },
  {
    key: "info",
    title: "Manage Profile",
    desc: "Access and manage your company information.",
    button: "View",
    route: "/businessInformation",
    image: imgInfo,
  },
  // {
  //   key: "legal",
  //   title: "Legal / Documentation",
  //   desc: "Access and manage your company documents.",
  //   button: "Manage",
  //   route: "/business/legal",
  //   image: imgLegal,
  // },
];

export default function BusinessDashboard() {
  const history = useHistory();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // simulate data fetch
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Spin tip="Loading..." style={{ margin: 40, display: "block" }} />;
  }

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[24, 24]}>
        {tiles.map(({ key, title, desc, button, route, image }) => (
          <Col
            key={key}
            xs={24}
            sm={12}
            md={12}
            lg={6}
            xl={6}
            style={{ display: "flex", justifyContent: "center" }}
          >
            <Card
              hoverable
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                borderRadius: 8,
              }}
              bodyStyle={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                padding: 16,
              }}
              cover={
                <div
                  style={{
                    height: 120,
                    backgroundImage: `url(${image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    borderRadius: "8px 8px 0 0",
                    marginBottom: 16,
                  }}
                />
              }
            >
              <div style={{ flex: 1, fontWeight:700 }}>
                <Text strong style={{ fontSize: 16 }}>{title}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {desc}
                </Text>
              </div>
              <div style={{ textAlign: "right", marginTop: 16 }}>
                <Button
                  // type="primary"
                  size="small"
                  onClick={() => history.push(route)}
                  className="view-btn"
                >
                  {button}
                   {/* &rarr; */}
                </Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
