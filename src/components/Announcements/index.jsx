import { useState, useEffect } from 'react';
import './Announcements.css';
import { useDispatch, useSelector } from 'react-redux';
import { Editor } from '@tinymce/tinymce-react'; // Import Editor from TinyMCE
import { sendEmail, broadcastEmailsToAll } from '../../actions/sendEmails';
import { boxStyle, boxStyleDark } from 'styles';
import { toast } from 'react-toastify';

function Announcements() {
  const darkMode = useSelector(state => state.theme.darkMode);
  const dispatch = useDispatch();
  const [emailList, setEmailList] = useState([]);
  const [emailContent, setEmailContent] = useState('');
  const [headerContent, setHeaderContent] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [showEditor, setShowEditor] = useState(true); // State to control rendering of the editor

  useEffect(() => {
    // Toggle the showEditor state to force re-render when dark mode changes
    setShowEditor(false);
    setTimeout(() => setShowEditor(true), 0);
  }, [darkMode]);

  const editorInit = {
    license_key: 'gpl',
    selector: 'Editor#email-editor',
    height: 500,
    menubar: false,
    branding: false,
    plugins: 'advlist autolink lists link image charmap preview anchor help \
      searchreplace visualblocks code insertdatetime media table wordcount\
      fullscreen emoticons nonbreaking',
    image_title: true,
    automatic_uploads: true,
    file_picker_callback(cb, value, meta) {
      const input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', 'image/*');

      /*
        Note: In modern browsers input[type="file"] is functional without
        even adding it to the DOM, but that might not be the case in some older
        or quirky browsers like IE, so you might want to add it to the DOM
        just in case, and visually hide it. And do not forget do remove it
        once you do not need it anymore.
      */

      input.onchange = function() {
        const file = this.files[0];

        const reader = new FileReader();
        reader.onload = function() {
          /*
            Note: Now we need to register the blob in TinyMCEs image blob
            registry. In the next release this part hopefully won't be
            necessary, as we are looking to handle it internally.
          */
          const id = `blobid${new Date().getTime()}`;
          const { blobCache } = tinymce.activeEditor.editorUpload;
          const base64 = reader.result.split(',')[1];
          const blobInfo = blobCache.create(id, file, base64);
          blobCache.add(blobInfo);

          /* call the callback and populate the Title field with the file name */
          cb(blobInfo.blobUri(), { title: file.name });
        };
        reader.readAsDataURL(file);
      };

      input.click();
    },
    a11y_advanced_options: true,
    toolbar:
      'undo redo | bold italic | blocks fontfamily fontsize | image table |\
      alignleft aligncenter alignright | \
      bullist numlist outdent indent | removeformat | help',
    skin: darkMode ? 'oxide-dark' : 'oxide',
    content_css: darkMode ? 'dark' : 'default',
  }

  const handleEmailListChange = e => {
    const emails = e.target.value.split(',');
    setEmailList(emails);
  };
  
  const handleHeaderContentChange = e => {
    setHeaderContent(e.target.value);
  }

  // const htmlContent = `<html><head><title>Weekly Update</title></head><body>${emailContent}</body></html>`;
  const addHeaderToEmailContent = () => {
    if (!headerContent) return;
    const imageTag = `<img src="${headerContent}" alt="Header Image" style="width: 100%; max-width: 100%; height: auto;">`;
      const editor = tinymce.get('email-editor');
      if (editor) {
        editor.insertContent(imageTag);
        setEmailContent(editor.getContent());
      }
  };
  const handleSendEmails = () => {
    const htmlContent = emailContent;
    // Send the HTML content using your sendEmail function
    if(emailList.length === 0 || emailList.every(email => !email.trim())){
      toast.error(
        'Error: Empty Email List. Please enter AT LEAST One email.',
      );
    }else{
      dispatch(sendEmail(emailList.join(','), 'Weekly Update', htmlContent));
    }
    
  };

  const handleBroadcastEmails = () => {
    const htmlContent = `
    <div style="max-width: 900px; width: 100%; margin: auto;">
      ${emailContent}
    </div>
  `;
    dispatch(broadcastEmailsToAll('Weekly Update', htmlContent));
  };

  return (
    <div className={darkMode ? 'bg-oxford-blue text-light' : ''} style={{minHeight: "100%"}}>
      <div className="email-update-container">
        <div className="editor">
          <h3>Weekly Progress Editor</h3>
          <br />
          {showEditor && <Editor
            tinymceScriptSrc="/tinymce/tinymce.min.js"
            id="email-editor"
            initialValue="<p>This is the initial content of the editor</p>"
            init={editorInit}
            onEditorChange={(content, editor) => {
              setEmailContent(content);
            }}
          />}
          <button type="button" className="send-button" onClick={handleBroadcastEmails} style={darkMode ? boxStyleDark : boxStyle}>
            Broadcast Weekly Update
          </button>
        </div>
        <div className={`emails ${darkMode ? 'bg-yinmn-blue' : ''}`}  style={darkMode ? boxStyleDark : boxStyle}>
          Email List (comma-separated):
          <input type="text" onChange={handleEmailListChange} className='input-text-for-announcement' />
          <button type="button" className="send-button" onClick={handleSendEmails} style={darkMode ? boxStyleDark : boxStyle}>
            Send Email to specific user
          </button>
          <div>
            <hr />
            <p>Insert image link<br/>(or upload image from editor)</p>
            <div style={{ overflow: 'hidden' }}>
              <input type="text" onChange={handleHeaderContentChange} className='input-text-for-announcement'/>
            </div>
            <button type="button" className="send-button" onClick={addHeaderToEmailContent} style={darkMode ? boxStyleDark : boxStyle}>
              Insert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Announcements;

