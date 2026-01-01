// src/pages/EditBusinessDocuments.js
import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Form,
  Button,
  Spin,
  Alert,
  message,
  Upload,
  Typography,
} from "antd";
import { UploadOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useHistory } from "react-router-dom";
import { api } from "../api";

const { Title } = Typography;

const BACKEND = "https://api.925investor.com";
const DOC_FIELDS = [
  "incorporationCertificate",
  "companyPanDoc",
  "udyamAdharDoc",
  "moaDoc",
  "aoaDoc",
  "gstDoc",
];

function normalizeUrl(rawPath) {
  return rawPath ? `${BACKEND}/${rawPath.replace(/\\/g, "/")}` : null;
}
function toFileList(rawPath) {
  const url = normalizeUrl(rawPath);
  return url
    ? [{ uid: "-1", name: url.split("/").pop(), status: "done", url }]
    : [];
}

export default function EditBusinessDocuments() {
  const [form] = Form.useForm();
  const [business, setBusiness] = useState(null);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const history = useHistory();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get("/business/getMyBusiness", {
          headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
        });
        const biz = data["Business:"] || {};
        if (cancelled) return;

        // store the full biz object for scalar fields
        setBusiness(biz);

        // prefill only the file‐list Form.Items
        const initialFiles = DOC_FIELDS.reduce((acc, field) => {
          acc[field] = toFileList(biz[field]);
          return acc;
        }, {});
        form.setFieldsValue(initialFiles);

        setDocs([
          ["incorporationCertificate", "Incorporation Certificate"],
          ["companyPanDoc", "Company PAN Document"],
          ["udyamAdharDoc", "Udyam Aadhaar Document"],
          ["moaDoc", "MOA Document"],
          ["aoaDoc", "AOA Document"],
          ["gstDoc", "GST Certificate"],
        ]);
      } catch (e) {
        if (!cancelled) {
          console.error(e);
          setError("Failed to load existing documents.");
          message.error("Could not fetch docs.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [form]);

  const normFile = (e) => (Array.isArray(e) ? e : e?.fileList);

  const onFinish = async (values) => {
    if (!business) return;
    setSaving(true);

    const fd = new FormData();

    // 1) Append scalar fields from the original business object
    //    so they aren’t wiped out:
    fd.append("companyPanNumber", business.companyPanNumber || "");
    fd.append("udyamAdharNumber", business.udyamAdharNumber || "");
    fd.append("gstCertificateNumber", business.gstCertificateNumber || "");
    fd.append("password", business.password || "");

    // 2) Append any newly‐selected files
    DOC_FIELDS.forEach((field) => {
      const fileObj = values[field]?.[0]?.originFileObj;
      if (fileObj) {
        fd.append(field, fileObj);
      }
    });

    try {
      const { data } = await api.post("/business/addBusinessDetails", fd, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      });
      if (data.status) {
        message.success("Documents updated!");
        history.push("/businessDocuments");
      } else {
        throw new Error(data.message || "Update failed");
      }
    } catch (e) {
      console.error(e);
      message.error(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Spin tip="Loading documents..." style={{ margin: 40, display: "block" }} />;
  }
  if (error) {
    return <Alert type="error" message={error} style={{ margin: 40 }} />;
  }

  return (
    <div style={{ padding: 24, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Title level={3}>Edit Document</Title>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          <Button
            onClick={() => history.goBack()}
            className="cta-btn"
            shape="circle"
            style={{
              width: 40,
              height: 40,
              padding: 0,
              // background: "#1890ff",
              border: "none",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
            }}
            icon={<ArrowLeftOutlined style={{ fontSize: 18, color: "#fff" }} />}
          />
        </div>
      </div>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Row gutter={[16, 16]}>
          {docs.map(([name, label]) => (
            <Col xs={24} sm={12} key={name}>
              <Form.Item
                name={name}
                label={label}
                valuePropName="fileList"
                getValueFromEvent={normFile}
              >
                <Upload
                  beforeUpload={() => false}
                  maxCount={1}
                  listType="text"
                  accept=".pdf,.jpg,.png,.doc,.docx"
                  showUploadList={{ showRemoveIcon: false }}
                >
                  <Button
                    icon={<UploadOutlined />}
                    block
                    style={{
                      maxWidth: "100%",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Upload {label}
                  </Button>
                </Upload>
              </Form.Item>
            </Col>
          ))}
        </Row>

        <Row justify="end" style={{ marginTop: 24 }}>
          <Button type="primary" className="cta-btn" htmlType="submit" loading={saving}>
            Save Documents
          </Button>
        </Row>
      </Form>
    </div>
  );
}
