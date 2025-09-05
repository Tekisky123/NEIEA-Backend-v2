import validator from "validator";

const validateVolunteer = (req, res, next) => {
  const {
    firstName,
    lastName,
    dob,
    gender,
    phone,
    email,
    address,
    dailyCommitment,
    availability,
    volunteerField,
    socialMedia,
    contentCreation,
    outreach,
    fundraising,
    teachingExperience,
    onlineTeachingYears,
    ageGroups,
    confidentSubjects,
    relevantExperience,
    motivation,
    commitmentDuration,
    dateOfJoining,
  } = req.body;

  const errors = {};

  // Validate Step 1 fields
  if (!firstName || typeof firstName !== "string" || firstName.trim() === "") {
    errors.firstName = "First name is required";
  }
  if (!lastName || typeof lastName !== "string" || lastName.trim() === "") {
    errors.lastName = "Last name is required";
  }
  if (!dob || !validator.isISO8601(dob)) {
    errors.dob = "Valid date of birth is required";
  }
  if (!gender || !["Male", "Female"].includes(gender)) {
    errors.gender = "Valid gender is required";
  }
  if (!phone || typeof phone !== "string" || phone.trim() === "") {
    errors.phone = "Phone number is required";
  }
  if (!email || !validator.isEmail(email)) {
    errors.email = "Valid email is required";
  }
  if (!address) {
    errors.address = "Address is required";
  } else {
    if (!address.city || typeof address.city !== "string" || address.city.trim() === "") {
      errors.city = "City is required";
    }
    if (!address.state || typeof address.state !== "string" || address.state.trim() === "") {
      errors.state = "State is required";
    }
    if (!address.country || typeof address.country !== "string" || address.country.trim() === "") {
      errors.country = "Country is required";
    }
  }
  if (!dailyCommitment || typeof dailyCommitment !== "string" || dailyCommitment.trim() === "") {
    errors.dailyCommitment = "Daily commitment is required";
  }
  if (!availability || !Array.isArray(availability) || availability.length === 0) {
    errors.availability = "Availability is required";
  }
  if (!volunteerField || typeof volunteerField !== "string" || volunteerField.trim() === "") {
    errors.volunteerField = "Volunteer field is required";
  }

  // Validate Step 2 fields based on volunteerField
  if (volunteerField === "Social Media Management") {
    if (!socialMedia) {
      errors.socialMedia = "Social media details are required";
    } else {
      if (!socialMedia.facebook || !["Expert", "Intermediate", "Beginner", "No Experience", ""].includes(socialMedia.facebook)) {
        errors.facebook = "Valid Facebook experience is required";
      }
      if (!socialMedia.linkedIn || !["Expert", "Intermediate", "Beginner", "No Experience", ""].includes(socialMedia.linkedIn)) {
        errors.linkedIn = "Valid LinkedIn experience is required";
      }
      if (!socialMedia.instagram || !["Expert", "Intermediate", "Beginner", "No Experience", ""].includes(socialMedia.instagram)) {
        errors.instagram = "Valid Instagram experience is required";
      }
      if (!socialMedia.twitter || !["Expert", "Intermediate", "Beginner", "No Experience", ""].includes(socialMedia.twitter)) {
        errors.twitter = "Valid Twitter experience is required";
      }
      if (!socialMedia.youTube || !["Expert", "Intermediate", "Beginner", "No Experience", ""].includes(socialMedia.youTube)) {
        errors.youTube = "Valid YouTube experience is required";
      }
    }
  }
  else if (volunteerField === "Content Creation") {
    if (!contentCreation) {
      errors.contentCreation = "Content creation details are required";
    } else {
      if (contentCreation.hasExperience === undefined) {
        errors.hasExperience = "Experience status is required";
      }
      if (!contentCreation.createdBefore || !Array.isArray(contentCreation.createdBefore) || contentCreation.createdBefore.length === 0) {
        errors.createdBefore = "Created before details are required";
      }
      if (!contentCreation.toolsUsed || !Array.isArray(contentCreation.toolsUsed) || contentCreation.toolsUsed.length === 0) {
        errors.toolsUsed = "Tools used details are required";
      }
    }
  }
  else if (volunteerField === "Outreach") {
    if (!outreach) {
      errors.outreach = "Outreach details are required";
    } else {
      if (outreach.hasOutreachExperience === undefined) {
        errors.hasOutreachExperience = "Outreach experience status is required";
      }
      if (!outreach.outreachActivities || !Array.isArray(outreach.outreachActivities) || outreach.outreachActivities.length === 0) {
        errors.outreachActivities = "Outreach activities are required";
      }
    }
  }
  else if (volunteerField === "Fundraising") {
    if (!fundraising) {
      errors.fundraising = "Fundraising details are required";
    } else {
      if (fundraising.hasFundraisingExperience === undefined) {
        errors.hasFundraisingExperience = "Fundraising experience status is required";
      }
      if (!fundraising.fundraisingTypes || !Array.isArray(fundraising.fundraisingTypes) || fundraising.fundraisingTypes.length === 0) {
        errors.fundraisingTypes = "Fundraising types are required";
      }
    }
  }
  else if (volunteerField === "Teaching") {
    if (!teachingExperience || typeof teachingExperience !== "string" || teachingExperience.trim() === "") {
      errors.teachingExperience = "Teaching experience is required";
    }
    if (!onlineTeachingYears || typeof onlineTeachingYears !== "string" || onlineTeachingYears.trim() === "") {
      errors.onlineTeachingYears = "Online teaching years is required";
    }
    if (!ageGroups || !Array.isArray(ageGroups) || ageGroups.length === 0) {
      errors.ageGroups = "Age groups are required";
    }
    if (!confidentSubjects || !Array.isArray(confidentSubjects) || confidentSubjects.length === 0) {
      errors.confidentSubjects = "Subjects are required";
    }
  }

  // Validate Step 3 fields
  if (!relevantExperience || typeof relevantExperience !== "string" || relevantExperience.trim() === "") {
    errors.relevantExperience = "Relevant experience is required";
  }
  if (!motivation || typeof motivation !== "string" || motivation.trim() === "") {
    errors.motivation = "Motivation is required";
  }
  if (!commitmentDuration || typeof commitmentDuration !== "string" || commitmentDuration.trim() === "") {
    errors.commitmentDuration = "Commitment duration is required";
  }
  if (!dateOfJoining || !validator.isISO8601(dateOfJoining)) {
    errors.dateOfJoining = "Valid date of joining is required";
  }

  // If there are errors, return them
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  // If validation passes, proceed to the next middleware
  next();
};

export default validateVolunteer ;
