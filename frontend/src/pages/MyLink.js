// MyLink.js - Página de mensajería MyLink
import React from 'react';
import { useParams } from 'react-router-dom';
import MyLinkMessages from '../components/DirectMessages';

export default function MyLinkPage() {
  const { peerId } = useParams();
  const user = JSON.parse(localStorage.getItem('user'));
  const peer = JSON.parse(localStorage.getItem('peer')) || { id: Number(peerId), username: 'Usuario' };
  return (
    <div style={{maxWidth:500,margin:'0 auto'}}>
      <h2>MyLink Mensajería</h2>
      <MyLinkMessages user={user} peer={peer} />
    </div>
  );
}
