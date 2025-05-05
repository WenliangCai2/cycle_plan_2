const backgroundStyle = {
  backgroundImage: `url(${backgroundImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundAttachment: 'fixed',
  backgroundRepeat: 'no-repeat',
  minHeight: '100vh',
  width: '100vw',
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: -1
};

const contentStyle = {
  position: 'relative',
  zIndex: 1,
  minHeight: '100vh',
  paddingTop: '40px',
  paddingBottom: '40px'
};

return (
  <Box>
    <Box sx={backgroundStyle} />
    <Box sx={contentStyle}>
      <Container maxWidth="xl">
        {/* ... existing code ... */}
      </Container>
    </Box>
  </Box>
); 