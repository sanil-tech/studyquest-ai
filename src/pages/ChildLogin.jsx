import { db } from "./dbClient";

export async function onRequest(request) {
  try {
    // Parse request body
    const body = await request.json();

    const studentId = String(body.student_id || "")
      .trim()
      .toUpperCase();

    const password = String(body.password || "").trim();
    const pin = String(body.pin || "").trim();

    // Validate Student ID
    if (!studentId) {
      return Response.json(
        {
          success: false,
          error: "Student ID is required."
        },
        {
          status: 400
        }
      );
    }

    // Get student record
    const { data: student, error } = await db
      .from("students")
      .select("*")
      .eq("student_id", studentId)
      .maybeSingle();

    if (error) {
      console.error("Database Error:", error);

      return Response.json(
        {
          success: false,
          error: "Database error."
        },
        {
          status: 500
        }
      );
    }

    if (!student) {
      return Response.json(
        {
          success: false,
          error: "Incorrect Student ID or password."
        },
        {
          status: 401
        }
      );
    }

    // PASSWORD LOGIN
    if (password) {

      // Plain-text comparison
      // Replace with your hashing method if Base44 supports one.
      if (student.password !== password) {
        return Response.json(
          {
            success: false,
            error: "Incorrect Student ID or password."
          },
          {
            status: 401
          }
        );
      }

    }

    // PIN LOGIN
    else if (pin) {

      if (String(student.pin || "").trim() !== pin) {
        return Response.json(
          {
            success: false,
            error: "Incorrect PIN."
          },
          {
            status: 401
          }
        );
      }

    }

    // Neither password nor PIN supplied
    else {

      return Response.json(
        {
          success: false,
          error: "Password or PIN is required."
        },
        {
          status: 400
        }
      );

    }

    // Success
    return Response.json({
      success: true,
      user: {
        id: student.id,
        student_id: student.student_id,
        name: student.name,
        nickname: student.nickname || student.name,
        avatar: student.avatar || null,
        level: student.level || 1,
        profile_completed: !!student.profile_completed
      }
    });

  } catch (err) {

    console.error(err);

    return Response.json(
      {
        success: false,
        error: "Internal server error."
      },
      {
        status: 500
      }
    );

  }
}