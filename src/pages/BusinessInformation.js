// src/pages/BusinessInformation.js
import React, { useState, useEffect } from "react";
import { Row, Col, Card, Typography, Button, Spin } from "antd";
import { useHistory } from "react-router-dom";

// import each image
import imgCompany from "../assets/images/business-images/company-info.png";
import imgDirectors from "../assets/images/business-images/directors-info.png";
import imgDocs from "../assets/images/business-images/docs-info.jpg";

const { Text } = Typography;

const infoTiles = [
  {
    key: "company",
    title: "Company Information",
    desc: "Enter company information for the business.",
    button: "View",
    route: "/businessProfile",
    image: imgCompany,
  },
  {
    key: "directors",
    title: "Directors / Co‑Owners",
    desc: "View and manage details of directors and co‑owners.",
    button: "View",
    route: "/businessOwnersList",
    image: imgDirectors,
  },
  {
    key: "docs",
    title: "Company Docs",
    desc: "Access and manage your company documents.",
    button: "View",
    route: "/businessDocuments",
    image: imgDocs,
  },
];

export default function BusinessInformation() {
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


    <div style={{ padding: 24, fontFamily: "Inter, sans-serif" }}>
      <Row gutter={[24, 24]} justify="center">
        {infoTiles.map(({ key, title, desc, button, route, image }) => (
          <Col
            key={key}
            xs={24}
            sm={12}
            md={8}
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
                  className="view-btn"
                  size="small"
                  onClick={() => history.push(route)}
                >
                  {button}
                </Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
