
export const monthsOuterWrapper = {
  display: "flex",
  gap: "1rem",
  marginLeft: "0",
  position: "relative",
};

export const currentMonth = {
  textWrap: "nowrap",
  background: `linear-gradient(to right, #75ebbc,#51b8b4)`,
  height: "fit-content",
  padding: "0rem 2vw",
  width: "fit-content",
  color: "#22608a",
  userSelect: "none",
  cursor: "pointer",

  fontSize: "3rem",
  fontFamily: "Dela Gothic One",
  fontWeight: 900,
  fontStyle: "black",
  transform: "rotate(-5deg)",
  lineHeight: 1.4,
  overflow: "visible",
  marginBottom: "2rem",
};

export const monthsInnerWrapper = {
  zIndex: '101',
  textWrap: "nowrap",
  userSelect: "none",
  display: "flex",
  flexDirection: "column",
  color: "#22608a",
  background: `linear-gradient(to right, #75ebbc, #3997af)`,
  padding: ".5rem 0",

  fontSize: "2rem",
  fontFamily: "Dela Gothic One",
  fontWeight: 600,
  fontStyle: "black",
  display: "none",
  position: "absolute",
  left: "6rem",
  position: "absolute",
  top: "6rem",
  left: "0rem",
};

export const month = {
  textWrap: "nowrap",
  padding: "0",
  paddingLeft: "5rem",
  paddingRight: "15rem",
  cursor: "pointer",
  hover: {
    backgroundColor: "white",
  },
};

const year = {
  textWrap: "nowrap",
  padding: "1vw 2vw",
  color: "#82ffc3",
  width: "fit-content",
  userSelect: "none",
  cursor: "pointer",
  fontSize: "3rem",
  fontWeight: "900",
  transform: "rotate(5deg) translateY(-2rem)",
  position: "absolute",
  backgroundColor: "#3a98b0",
  fontFamily: "Dela Gothic One",
};
export const arrow_container = {
  display: 'flex',
  fontWeight: '900',
  color: '#22608a',
  userSelect: 'none',
};
export const arrow = {
  width: '7rem',
  rotate: '45deg',
  pointerEvents: 'none'
};
export const yearWrapper = {
  height: "5rem",
  display: "flex",
  gap: "1rem",
  marginBottom: "1rem",
  fontFamily: "Open Sans",
  width: "15rem",
  justifyContent: "center",
  alignItems: "center",
};
export const hiddenYear = {
  ...year,
  zIndex: "2",
};

export const displayedYear = {
  ...year,
  zIndex: "3",
};

export const circleWrapper = {
  backgroundColor: "white",
  fontSize: "2rem",
  width: "3rem",
  height: "3rem",
  borderRadius: "1000px",
  position: "relative",
  boxShadow: "0px 7px 10px rgba(0,0,0,.3)",
  zIndex: "3",
};

export const circleDigit = {
  userSelect: "none",
  fontFamily: "",
  position: "absolute",
  width: "100%",
  height: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  color: "#0f81a3",
  fontStyle: "normal",
  fontWeight: 600,
  zIndex: "3",
};
export const horizontalLine = {
  position: "absolute",
  backgroundColor: "white",
  width: "100%",
  height: ".3rem",
  zIndex: "2",
  top: "3rem",
  boxShadow: "0px 5px 5px rgb(50,50,50)",
};
export const verticalLine = {
  position: "absolute",
  backgroundColor: "white",
  width: ".3rem",
  height: "3rem",
  zIndex: "2",
  top: "3rem",
  boxShadow: "0 3px 5px rgb(50,50,50)",
};

export const dateWrapper = {
  display: "flex",
  gap: "3vw",
  flexWrap: "wrap",
  justifyContent: "center",
  alignItems: "center",
  marginTop: '1rem',
  position: 'relative'
};
export const dateCalendrier = {
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
  marginTop: "0rem",
  fontFamily: "Open Sans",
};
export const statCalendrier = {
  color: "white",
  fontSize: "3vw",
  textAlign: "center",
  userSelect: "none",
  marginTop: "2rem",
};
