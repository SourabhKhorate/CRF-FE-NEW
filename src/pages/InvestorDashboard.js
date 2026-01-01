// src/pages/InvestorDashboard.js
import React, { useState, useEffect } from "react";
import { Row, Col, Card, Typography, Button, Spin } from "antd";
import { useHistory } from "react-router-dom";

// import your images
import imgListed from "../assets/images/investor-images/listed-company.jpg";
import imgTotal from "../assets/images/investor-images/total-investments.jpg";
import imgMy from "../assets/images/investor-images/my-investments.jpg";
import imgProfile from "../assets/images/investor-images/my-profile.jpg";
import imgLegal from "../assets/images/investor-images/legal-documents.png";

const { Text } = Typography;

const tiles = [
  {
    key: "my",
    title: "My Investments",
    desc: "Manage your ongoing investments.",
    button: "Track",
    route: "/myInvestment",
    image: imgMy,
  },
  {
    key: "listed",
    title: "Listed Companies",
    desc: "Explore companies seeking investment.",
    button: "View",
    route: "/listedCompany",
    image: imgListed,
  },
  // {
  //   key: "total",
  //   title: "Total Investments",
  //   desc: "View your past & current investments.",
  //   button: "View",
  //   route: "/totalInvestment",
  //   image: imgTotal,
  // },
  
  {
    key: "profile",
    title: "Manage Profile",
    desc: "Access and manage your personal info.",
    button: "View",
    route: "/investorProfile",
    image: imgProfile,
  },
  // {
  //   key: "legal",
  //   title: "Legal",
  //   desc: "Access and manage your documents.",
  //   button: "Manage",
  //   route: "/legalDocuments",
  //   image: imgLegal,
  // },
];

export default function InvestorDashboard() {
  const history = useHistory();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate a delay for loading effect
    const timer = setTimeout(() => setLoading(false), 500);
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
              <div style={{ flex: 1 }}>
                <Text strong>{title}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {desc}
                </Text>
              </div>

              <div style={{ textAlign: "right", marginTop: 16 }}>
                <Button
                  type="primary"
                  className="cta-btn"
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
