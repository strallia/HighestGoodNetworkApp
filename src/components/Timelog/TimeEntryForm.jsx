import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router";
import {
  Form,
  FormGroup,
  Label,
  Input,
  Row,
  Col,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "reactstrap";
import moment from "moment";
import _ from "lodash";
import { Editor } from "@tinymce/tinymce-react";
import ReactHtmlParser from "react-html-parser";
import { postTimeEntry, editTimeEntry } from "../../actions/timeEntries";
import { getUserProjects } from "../../actions/userProjects";
import { stopTimer } from "../../actions/timer";

const TimeEntryForm = ({ userId, edit, data, isOpen, toggle, timer }) => {
  const fromTimer = !_.isEmpty(timer);

  const initialState = {
    dateOfWork: moment().format("YYYY-MM-DD"),
    hours: 0,
    minutes: 0,
    projectId: "",
    notes: "",
    isTangible: data ? data.isTangible : true,
  };
  const initialReminder = {
    notification: false,
    has_link: false,
    remind: "",
    num_words: 0,
  };

  const [inputs, setInputs] = useState(edit ? data : initialState);
  const [errors, setErrors] = useState({});
  const dispatch = useDispatch();
  const history = useHistory();
  const [reminder, setReminder] = useState(edit ? data : initialReminder);

  const openModal = () =>
    setReminder((reminder) => ({
      ...reminder,
      notification: !reminder.notification,
    }));

  useEffect(() => {
    const fetchProjects = async (userId) => {
      await dispatch(getUserProjects(userId));
    };
    fetchProjects(userId);
  }, [userId]);

  useEffect(() => {
    setInputs({ ...inputs, ...timer });
  }, [timer]);

  const userProjects = useSelector((state) => state.userProjects);
  let projects = [];
  if (!_.isEmpty(userProjects)) {
    projects = userProjects.projects;
  }
  const projectOptions = projects.map((project) => (
    <option value={project.projectId} key={project.projectId}>
      {" "}
      {project.projectName}{" "}
    </option>
  ));
  projectOptions.unshift(
    <option value="" key="" disabled>
      Select Project
    </option>
  );

  const validateForm = () => {
    const result = {};

    if (inputs.dateOfWork === "") {
      result.dateOfWork = "Date is required";
    } else {
      const date = moment(inputs.dateOfWork);
      if (!date.isValid()) {
        result.dateOfWork = "Invalid date";
      }
    }

    if (inputs.hours === "" && inputs.minutes === "") {
      result.time = "Time is required";
    } else {
      const hours = inputs.hours === "" ? 0 : inputs.hours * 1;
      const minutes = inputs.minutes === "" ? 0 : inputs.minutes * 1;
      if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
        result.time = "Hours and minutes should be integers";
      }
      if (hours < 0 || minutes < 0 || (hours === 0 && minutes === 0)) {
        result.time = "Time should be greater than 0";
      }
    }

    if (inputs.projectId === "") {
      result.projectId = "Project is required";
    }

    if (reminder.num_words < 10) {
      openModal();
      setReminder((reminder) => ({
        ...reminder,
        remind:
          "Please write a more detailed description of your work completed, write at least 1-2 sentences.",
      }));
      result.notes = "Description and reference link are required";
    }

    if (reminder.num_words >= 10 && !reminder.has_link) {
      openModal();
      setReminder((reminder) => ({
        ...reminder,
        remind:
          "Do you have a link to your Google Doc or other place to review this work? You should add it if you do.",
      }));
      result.notes = "Description and reference link are required";
    }

    // if (inputs.notes === "") {
    //   result.notes = "Description and reference link are required";
    // }

    setErrors(result);
    return _.isEmpty(result);
  };

  const handleSubmit = async (event) => {
    if (event) {
      event.preventDefault();
    }

    if (!validateForm()) {
      return;
    }

    const timeEntry = {};

    timeEntry.personId = userId;
    timeEntry.dateOfWork = inputs.dateOfWork;

    timeEntry.projectId = inputs.projectId;
    timeEntry.notes = inputs.notes;
    timeEntry.isTangible = inputs.isTangible.toString();

    const hours = inputs.hours === "" ? "0" : inputs.hours;
    const minutes = inputs.minutes === "" ? "0" : inputs.minutes;

    let status;
    if (edit) {
      timeEntry.hours = hours;
      timeEntry.minutes = minutes;
      status = await dispatch(editTimeEntry(data._id, timeEntry));
    } else {
      timeEntry.timeSpent = `${hours}:${minutes}:00`;
      status = await dispatch(postTimeEntry(timeEntry));
    }

    if (fromTimer) {
      if (status === 200) {
        const timerStatus = await dispatch(stopTimer(userId));
        if (timerStatus === 200 || timerStatus === 201) {
          setInputs((inputs) => initialState);
          setReminder((reminder) => initialReminder);
          toggle();
        }
        history.push(`/timelog/${userId}`);
      }
    } else if (!edit) {
      setInputs((inputs) => initialState);
      setReminder((reminder) => initialReminder);
      toggle();
    } else {
      toggle();
    }
  };

  const handleInputChange = (event) => {
    event.persist();
    setInputs((inputs) => ({
      ...inputs,
      [event.target.name]: event.target.value,
    }));
  };

  const handleEditorChange = (content, editor) => {
    const { wordcount } = editor.plugins;

    setInputs((inputs) => ({ ...inputs, [editor.id]: content }));
    setReminder((reminder) => ({
      ...reminder,
      num_words: wordcount.body.getWordCount(),
      has_link:
        inputs.notes.indexOf("http://") > -1 ||
        inputs.notes.indexOf("https://") > -1,
    }));
  };

  const handleCheckboxChange = (event) => {
    event.persist();
    setInputs((inputs) => ({
      ...inputs,
      [event.target.name]: event.target.checked,
    }));
  };

  const clearForm = (event) => {
    setInputs((inputs) => initialState);
    setReminder((reminder) => initialReminder);
    setErrors((errors) => ({}));
  };

  const isAdmin =
    useSelector((state) => state.auth.user.role) === "Administrator";

  return (
    <Modal isOpen={isOpen} toggle={toggle}>
      <ModalHeader toggle={toggle}>
        {edit ? "Edit " : "Add "}
        Time Entry
      </ModalHeader>
      <ModalBody>
        <Form>
          <FormGroup>
            <Label for="dateOfWork">Date</Label>
            {isAdmin && !fromTimer ? (
              <Input
                type="date"
                name="dateOfWork"
                id="dateOfWork"
                value={inputs.dateOfWork}
                onChange={handleInputChange}
              />
            ) : (
              <Input
                type="date"
                name="dateOfWork"
                id="dateOfWork"
                value={inputs.dateOfWork}
                disabled
              />
            )}
            {"dateOfWork" in errors && (
              <div className="text-danger">
                <small>{errors.dateOfWork}</small>
              </div>
            )}
          </FormGroup>
          <FormGroup>
            <Label for="timeSpent">Time (HH:MM)</Label>
            <Row form>
              <Col>
                <Input
                  type="number"
                  name="hours"
                  id="hours"
                  placeholder="Hours"
                  value={inputs.hours}
                  onChange={handleInputChange}
                  disabled={fromTimer}
                />
              </Col>
              <Col>
                <Input
                  type="number"
                  name="minutes"
                  id="minutes"
                  placeholder="Minutes"
                  value={inputs.minutes}
                  onChange={handleInputChange}
                  disabled={fromTimer}
                />
              </Col>
            </Row>
            {"time" in errors && (
              <div className="text-danger">
                <small>{errors.time}</small>
              </div>
            )}
          </FormGroup>
          <FormGroup>
            <Label for="project">Project</Label>
            <Input
              type="select"
              name="projectId"
              id="projectId"
              value={inputs.projectId}
              onChange={handleInputChange}
            >
              {projectOptions}
            </Input>
            {"projectId" in errors && (
              <div className="text-danger">
                <small>{errors.projectId}</small>
              </div>
            )}
          </FormGroup>
          <FormGroup>
            <Label for="notes">Notes</Label>
            <Editor
              init={{
                menubar: false,
                placeholder: "Description and reference link",
                plugins:
                  "advlist autolink autoresize lists link charmap table paste help wordcount",
                toolbar:
                  "bold italic underline link removeformat | bullist numlist outdent indent |\
                                    styleselect fontsizeselect | table| strikethrough forecolor backcolor |\
                                    subscript superscript charmap  | help",
                branding: false,
                min_height: 180,
                max_height: 300,
                autoresize_bottom_margin: 1,
              }}
              id="notes"
              name="notes"
              className="form-control"
              value={inputs.notes}
              onEditorChange={handleEditorChange}
            />

            {"notes" in errors && (
              <div className="text-danger">
                <small>{errors.notes}</small>
              </div>
            )}
          </FormGroup>
          <FormGroup check>
            <Label check>
              {isAdmin || !edit ? (
                <Input
                  type="checkbox"
                  name="isTangible"
                  checked={inputs.isTangible}
                  onChange={handleCheckboxChange}
                />
              ) : (
                <Input
                  type="checkbox"
                  name="isTangible"
                  checked={inputs.isTangible}
                  disabled
                />
              )}{" "}
              Tangible
            </Label>
          </FormGroup>
        </Form>

        <Modal isOpen={reminder.notification} toggle={openModal}>
          <ModalHeader>Reminder</ModalHeader>
          <ModalBody>{reminder.remind}</ModalBody>
          <ModalFooter>
            <Button onClick={openModal} color="primary">
              close
            </Button>
          </ModalFooter>
        </Modal>
      </ModalBody>
      <ModalFooter>
        <small className="mr-auto text-secondary">
          * All the fields are required
        </small>
        <Button onClick={clearForm} color="danger">
          {" "}
          Clear Form{" "}
        </Button>
        <Button onClick={handleSubmit} color="primary">
          {edit ? "Save" : "Submit"}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default TimeEntryForm;
