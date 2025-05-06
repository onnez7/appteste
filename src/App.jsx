import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Account from './pages/Account';
import Consultations from './pages/Consultations';
import Subscriptions from './pages/Subscriptions';
import Measurements from './pages/Measurements';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/account" element={<Account />} />
      <Route path="/consultations" element={<Consultations />} />
      <Route path="/subscriptions" element={<Subscriptions />} />
      <Route path="/measurements" element={<Measurements />} />
    </Routes>
  );
}