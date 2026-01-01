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
    title: "Directors / Co-Owners",
    desc: "View and manage details of directors and co-owners.",
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
    <div style={{ padding: 24, fontFamily: "Roboto, sans-serif" }}>
      {/* Import fonts + component styles */}
      <style>{`
        /* Google Fonts - Inter primary, Roboto fallback */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Roboto:wght@400;500;700&display=swap');

        /* Page typography */
        .bi-page { font-family: 'Inter', 'Roboto', sans-serif; color: #0b1223; }
        .bi-card-title { font-weight: 700; font-size: 16px; color: #061243; }
        .bi-card-desc { font-size: 13px; color: #58616a; }

        /* VIEW BUTTON WITH SHINE EFFECT */
.view-btn {
  position: relative;
  overflow: hidden;
  background: linear-gradient(90deg,#2f80ed 0%, #1cb5e0 100%);
  color: #fff !important;
  border: 0;
  box-shadow: 0 6px 18px rgba(47,128,237,0.18);
  border-radius: 8px;
  padding: 6px 14px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: transform .2s ease, box-shadow .2s ease;
  font-weight: 600;
}

/* Zoom pop-up hover */
.view-btn:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 12px 28px rgba(47,128,237,0.30);
  background: linear-gradient(90deg,#2f80ed 0%, #1cb5e0 100%);
}

/* SHIMMER EFFECT LAYER */
.view-btn::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 60%;
  height: 100%;
  background: linear-gradient(
    120deg,
    rgba(255,255,255,0.0) 0%,
    rgba(255,255,255,0.4) 50%,
    rgba(255,255,255,0.0) 100%
  );
  transform: skewX(-20deg);
}

/* Shine animation on hover */
.view-btn:hover::before {
  animation: shineMove 0.8s ease-out forwards;
}

@keyframes shineMove {
  0% { left: -100%; }
  100% { left: 150%; }
}
  

        .view-btn:active {
          transform: translateY(0);
          box-shadow: 0 6px 12px rgba(47,128,237,0.14);
        }

        /* Card subtle styling */
        .bi-card {
          border-radius: 10px;
          transition: box-shadow .14s ease, transform .14s ease;
        }
        .bi-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(13,28,65,0.06);
        }

        /* Responsive tweaks */
        @media (max-width: 576px) {
          .view-btn { width: 100%; justify-content: center; }
          .bi-card-title { font-size: 15px; }
        }

        
      `}</style>

      <div className="bi-page">
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
                className="bi-card"
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
                  <div className="bi-card-title">{title}</div>
                  <br />
                  <div className="bi-card-desc">{desc}</div>
                </div>
                <div style={{ textAlign: "right", marginTop: 16 }}>
                  <Button
                    type="default"
                    size="small"
                    className="view-btn"
                    aria-label={`Open ${title}`}
                    onClick={() => history.push(route)}
                  >
                    {/* you can add an icon here if you want */}
                    {button}
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
}
