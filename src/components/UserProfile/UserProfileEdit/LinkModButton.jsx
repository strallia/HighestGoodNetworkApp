import React, { useState } from 'react';
//import PropTypes from 'prop-types';
import EditLinkModal from '../UserProfileModal/EditLinkModal';
// import styleEdit from './UserProfileEdit.module.scss';
import './UserProfileEdit.scss';

const LinkModButton = props => {
  const { updateLink, userProfile, setChanged } = props;
  const [modal, setModal] = useState(false);
  //const handleLinkModel = () => {};
  const toggleModal = () => {
    setModal(!modal);
  };
  return (
    <React.Fragment>
      <EditLinkModal
        updateLink={updateLink}
        isOpen={modal}
        closeModal={toggleModal}
        userProfile={userProfile}
        setChanged={setChanged}
        role={props.role}
      />
      <span
        style={{
          textDecoration: 'underline',
          color: 'grey',
          fontSize: '11pt',
          fontWeight: 600,
        }}
        data-testid="edit-link"
        role="button"
        type="button"
        onClick={toggleModal}
        href="#"
      >
        Edit
      </span>
    </React.Fragment>
  );
};

LinkModButton.propTypes = {};

export default LinkModButton;
