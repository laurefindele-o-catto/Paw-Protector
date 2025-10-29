import React from 'react';

const ProfilePictureCard = ({ imageUrl, name }) => (
  <div style={{
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '16px',
    width: '200px',
    textAlign: 'center',
    background: '#fff'
  }}>
    <img
      src={imageUrl}
      alt={name}
      style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        objectFit: 'cover',
        marginBottom: '12px'
      }}
    />
    <div style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{name}</div>
  </div>
);

export default ProfilePictureCard;