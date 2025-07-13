import { BrowserRouter as Router,Routes,Route } from 'react-router-dom';
import Home from "./Components/Home.jsx";
import NotFound from './NotFound.jsx';

export default function App() {
  return (
    <Router>

    <Routes>
      <Route path="/" element={<Home />} />
      <Route path='*' element={ <NotFound/>} />
      
    </Routes>
    </Router>
  );
}
