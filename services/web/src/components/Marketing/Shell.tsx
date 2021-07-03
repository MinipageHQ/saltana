import Header from './Header'
import Footer from './Footer'

function MarketingShell({ children }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  )
}

export default MarketingShell