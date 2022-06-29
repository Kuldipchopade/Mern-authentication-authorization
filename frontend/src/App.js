import { Fragment } from 'react';
import { Route, Routes } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Login from "./components/Login"
import Signup from "./components/Signup"
import Welcome from "./components/Welcome"
import { useSelector } from "react-redux"
function App() {
  const isLoggedIn = useSelector(state => state.isLoggedIn)
  console.log(isLoggedIn);

  return (
    <Fragment>
      <header>
        <Header />
      </header>
      <main>
        <Routes>
          <Route path='/login' element={<Login />}></Route>
          <Route path='/signup' element={<Signup />}></Route>
          {isLoggedIn && <Route path='/user' element={<Welcome />}></Route>}

        </Routes>
      </main>
    </Fragment>
  );
}

export default App;
