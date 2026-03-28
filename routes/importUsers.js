let express = require("express");
let router = express.Router();
let ExcelJS = require("exceljs");
let path = require("path");
let userModel = require("../schemas/users");
let roleModel = require("../schemas/roles");
let { sendWelcomeMail } = require("../utils/mailHandler");
let { uploadExcel } = require("../utils/uploadHandler");

function generatePassword(length = 16) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

router.post("/", uploadExcel.single("file"), async function (req, res, next) {
  try {
    if (!req.file) {
      return res
        .status(400)
        .send({ message: "File not found. Please upload an Excel file." });
    }

    let userRole = await roleModel.findOne({ name: "user" });
    if (!userRole) {
      let newRole = new roleModel({
        name: "user",
        description: "Regular user role",
      });
      await newRole.save();
      userRole = newRole;
    }

    let workbook = new ExcelJS.Workbook();
    let filePath = path.join(__dirname, "../uploads", req.file.filename);
    await workbook.xlsx.readFile(filePath);

    let worksheet = workbook.getWorksheet(1);
    if (!worksheet || worksheet.rowCount < 2) {
      return res
        .status(400)
        .send({ message: "Excel file is empty or has no data rows." });
    }

    let results = { success: [], failed: [] };

    for (let i = 2; i <= worksheet.rowCount; i++) {
      let row = worksheet.getRow(i);
      let username = row.getCell(1).text
        ? row.getCell(1).text.toString().trim()
        : null;
      let email = row.getCell(2).text
        ? row.getCell(2).text.toString().trim().toLowerCase()
        : null;

      if (!username || !email) {
        results.failed.push({
          row: i,
          username,
          email,
          error: "Missing username or email",
        });
        continue;
      }

      let existingUser = await userModel.findOne({
        $or: [{ username }, { email }],
        isDeleted: false,
      });

      if (existingUser) {
        results.failed.push({
          row: i,
          username,
          email,
          error: "Username or email already exists",
        });
        continue;
      }

      let password = generatePassword(16);

      let newUser = new userModel({
        username,
        email,
        password,
        role: userRole._id,
        status: true,
      });

      await newUser.save();

      try {
        await sendWelcomeMail(email, username, password);
      } catch (mailError) {
        console.error("Failed to send email to", email, mailError.message);
      }

      results.success.push({
        row: i,
        username,
        email,
        password,
        message: "User created and email sent",
      });
    }

    res.send({
      message: `Import completed. Success: ${results.success.length}, Failed: ${results.failed.length}`,
      results,
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

module.exports = router;
