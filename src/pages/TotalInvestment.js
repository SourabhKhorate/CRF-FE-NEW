// src/pages/TotalInvestment.js
import React, { useState } from "react";
import {
    Row,
    Col,
    Card,
    Typography,
    Button,
    Statistic,
    Space,
    Table,
    Input,
    Select,
} from "antd";
import { DownloadOutlined, SearchOutlined } from "@ant-design/icons";
import LineChart from "../components/chart/LineChart";

import ReactApexChart from "react-apexcharts";
import lineChart from "../components/chart/configs/lineChart"

const { Title, Text } = Typography;
const { Option } = Select;

export default function TotalInvestment() {
    // ─── DUMMY DATA ──────────────────────────────────────────────────────────────
    const kpis = {
        totalInvested: 5234567,
        totalCompanies: 125,
        totalInvestors: 342,
        avgPerRound: 41876,
    };
    const tableData = [
        {
            key: 1,
            investor: "Sophia Carter",
            company: "Tech Innovators Inc.",
            amount: "$15,000",
            date: "2023-08-15",
            round: "Seed",
            equity: "5%",
            status: "Active",
        },
        {
            key: 2,
            investor: "Ethan Bennett",
            company: "Eco Solutions Ltd.",
            amount: "$20,000",
            date: "2023-09-01",
            round: "Series A",
            equity: "7%",
            status: "Active",
        },
        {
            key: 3,
            investor: "Olivia Hayes",
            company: "HealthTech Ventures",
            amount: "$10,000",
            date: "2023-09-15",
            round: "Seed",
            equity: "3%",
            status: "Active",
        },
        // ...
    ];
    const columns = [
        { title: "Investor Name", dataIndex: "investor", key: "investor" },
        { title: "Company Name", dataIndex: "company", key: "company" },
        { title: "Amount Invested", dataIndex: "amount", key: "amount" },
        { title: "Investment Date", dataIndex: "date", key: "date" },
        { title: "Round Type", dataIndex: "round", key: "round" },
        { title: "Equity Received", dataIndex: "equity", key: "equity" },
        { title: "Status", dataIndex: "status", key: "status" },
        {
            title: "",
            key: "view",
            render: () => <a>View Details</a>,
        },
    ];
    // ──────────────────────────────────────────────────────────────────────────────

    // filter / search state (no real logic here)
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState({
        investor: null,
        company: null,
        sector: null,
        round: null,
        dateRange: null,
    });

    // small inline SVG sparklines for each month
    const sparklines = {
        Jan: "M0,30 C10,5 20,35 30,10 S50,40 60,20",
        Feb: "M0,40 C10,20 20,50 30,30 S50,45 60,25",
        Mar: "M0,35 C10,15 20,45 30,25 S50,30 60,15",
        Apr: "M0,25 C10,10 20,30 30,20 S50,35 60,18",
        May: "M0,20 C10,60 20,15 30,65 S50,30 60,50",
        Jun: "M0,30 C10,20 20,50 30,25 S50,55 60,35",
        Jul: "M0,40 C10,45 20,15 30,50 S50,20 60,30",
    };

    return (
        <div style={{ padding: 24 }}>
            {/* Title + Export */}
            <Row justify="space-between" align="middle">
                <Title level={3}>Total Investments</Title>
                <Button icon={<DownloadOutlined />}>Export Report</Button>
            </Row>

            {/* Search */}
            <Row style={{ marginTop: 16 }}>
                <Col span={24}>
                    <Input
                        placeholder="Search"
                        prefix={<SearchOutlined />}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        allowClear
                    />
                </Col>
            </Row>

            {/* Filters */}
            <Row gutter={[16, 16]} style={{ marginTop: 12 }}>
                {[
                    { key: "investor", placeholder: "Investor Name", width: 200 },
                    { key: "company", placeholder: "Company", width: 200 },
                    { key: "sector", placeholder: "Sector", width: 150 },
                    { key: "round", placeholder: "Investment Round", width: 160 },
                    { key: "dateRange", placeholder: "Date Range", width: 160 },
                ].map(({ key, placeholder, width }) => (
                    <Col xs={24} sm={12} md={8} lg={6} xl={4} key={key}>
                        <Select
                            placeholder={placeholder}
                            style={{ width: "100%" }}
                            allowClear
                            value={filters[key]}
                            onChange={(val) =>
                                setFilters((f) => ({ ...f, [key]: val }))
                            }
                        >
                            {/* dummy options */}
                            <Option value="Option 1">Option 1</Option>
                            <Option value="Option 2">Option 2</Option>
                        </Select>
                    </Col>
                ))}
            </Row>

            {/* KPI Cards */}
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Total Investment Amount"
                            value={kpis.totalInvested}
                            prefix="$"
                            precision={0}
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Total Companies Funded"
                            value={kpis.totalCompanies}
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Total Investors"
                            value={kpis.totalInvestors}
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Average per Round"
                            value={kpis.avgPerRound}
                            prefix="$"
                            precision={0}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Activity Over Time */}
            <Card style={{ marginTop: 24 }}>
                <Title level={4}>Investment Activity Over Time</Title>
                <Text strong style={{ fontSize: 24 }}>
                    ${kpis.totalInvested.toLocaleString()}
                </Text>
                <br />
                <Text type="success">Last 12 Months +12%</Text>

                {/* Replace the tiny sparklines with your ReactApexChart line chart */}
                {/* <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                    <Col span={24} className="mb-24">
                        <Card bordered={false} className="criclebox h-full">
                            <LineChart />
                        </Card>
                    </Col>
                </Row> */}

                <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card title="Active Users (Area Chart)">
            <ReactApexChart
              options={lineChart.options}
              series={lineChart.series}
              type="area"
              height={350}
            />
          </Card>
        </Col>
      </Row>

            </Card>

            {/* Details Table */}
            <Card style={{ marginTop: 24 }}>
                <Table
                    columns={columns}
                    dataSource={tableData}
                    pagination={false}
                    scroll={{ x: true }}
                />
            </Card>
        </div>
    );
}
