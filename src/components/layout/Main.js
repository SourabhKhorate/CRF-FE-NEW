import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Layout, Drawer, Affix } from "antd";
import Sidenav from "./Sidenav";
import Header from "./Header";
import Footer from "./Footer";

const { Header: AntHeader, Content, Sider } = Layout;

function Main({ children }) {
  const [visible, setVisible] = useState(false);
  const [placement, setPlacement] = useState("right");
  // const [sidenavColor, setSidenavColor] = useState("#1890ff");
  const [sidenavColor, setSidenavColor] = useState(
    "linear-gradient(90deg, #2e5384 0%, #1dacd4 100%)"
  );

  // const [sidenavType, setSidenavType] = useState("transparent");
  // const [sidenavType, setSidenavType] = useState("#e6f7ff");
  const [sidenavType, setSidenavType] = useState("#f0f0f0");
  // const [sidenavType, setSidenavType] = useState("#FAF9F6");
  // const [sidenavType, setSidenavType] = useState("#d9d9d9");
  const [fixed, setFixed] = useState(false);

  const openDrawer = () => setVisible(!visible);
  const handleSidenavType = (type) => setSidenavType(type);
  const handleSidenavColor = (color) => setSidenavColor(color);
  const handleFixedNavbar = (type) => setFixed(type);

  let { pathname } = useLocation();
  pathname = pathname.replace("/", "");

  // Helper: convert path -> human-friendly title
  const getTitleFromPath = (rawPath) => {
    if (!rawPath) return "";

    // remove query/hash, trim leading/trailing slashes
    let p = String(rawPath).split(/[?#]/)[0].replace(/^\/+|\/+$/g, "");
    if (!p) return "Home";

    // pick first meaningful segment (skip param tokens like :id and pure numbers)
    const segments = p.split("/");
    const chosen =
      segments.find((s) => s && !/^:\w+$/i.test(s) && !/^\d+$/.test(s)) ||
      segments[0];

    let base = (chosen || "").replace(/^:/, ""); // remove leading colon if any

    // normalize separators and split camelCase boundaries
    base = base.replace(/[-_]+/g, " ");
    base = base.replace(/([a-z0-9])([A-Z])/g, "$1 $2"); // camelCase -> spaces

    // remove trailing numbers like ...Information1
    base = base.replace(/\d+$/g, "");

    // collapse spaces and trim
    base = base.replace(/\s+/g, " ").trim();

    // Capitalize each word
    return base
      .split(" ")
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
      .join(" ");
  };

  // compute title once per render from current pathname (preserves all other uses of `pathname`)
  const pageTitle = getTitleFromPath(pathname);

  useEffect(() => {
    if (pathname === "rtl") {
      setPlacement("left");
    } else {
      setPlacement("right");
    }
  }, [pathname]);

  return (
    <Layout
      className={`layout-dashboard ${pathname === "profile" ? "layout-profile" : ""
        } ${pathname === "rtl" ? "layout-dashboard-rtl" : ""}`}
    >
      <Drawer
        title={false}
        placement={placement === "right" ? "left" : "right"}
        closable={false}
        onClose={() => setVisible(false)}
        visible={visible}
        key={placement === "right" ? "left" : "right"}
        width={250}
        className={`drawer-sidebar ${pathname === "rtl" ? "drawer-sidebar-rtl" : ""
          } `}
      >
        <Layout
          className={`layout-dashboard ${pathname === "rtl" ? "layout-dashboard-rtl" : ""
            }`}
        >
          <Sider
            trigger={null}
            width={250}
            theme="light"
            className={`sider-primary ant-layout-sider-primary ${sidenavType === "#fff" ? "active-route" : ""
              }`}
            style={{ background: sidenavType }}
          >
            <Sidenav color={sidenavColor} />
          </Sider>
        </Layout>
      </Drawer>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        onCollapse={(collapsed, type) => {
          // console.log(collapsed, type);
        }}
        trigger={null}
        width={270}
        theme="light"
        className={`sider-primary ant-layout-sider-primary ${sidenavType === "#fff" ? "active-route" : ""
          }`}
        style={{ background: sidenavType }}
      >
        <Sidenav color={sidenavColor} />
      </Sider>
      <Layout>
        {fixed ? (
          <Affix>
            <AntHeader className={`${fixed ? "ant-header-fixed" : ""}`}>
              <Header
                onPress={openDrawer}
                name={pageTitle}
                subName={pageTitle}
                handleSidenavColor={handleSidenavColor}
                handleSidenavType={handleSidenavType}
                handleFixedNavbar={handleFixedNavbar}
              />
            </AntHeader>
          </Affix>
        ) : (
          <AntHeader className={`${fixed ? "ant-header-fixed" : ""}`}>
            <Header
              onPress={openDrawer}
              name={pageTitle}
              subName={pageTitle}
              handleSidenavColor={handleSidenavColor}
              handleSidenavType={handleSidenavType}
              handleFixedNavbar={handleFixedNavbar}
            />
          </AntHeader>
        )}
        <Content className="content-ant">{children}</Content>
        <Footer />
      </Layout>
    </Layout>
  );
}

export default Main;
