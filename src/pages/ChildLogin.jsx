// childLogin Edge Function

import { db } from "./dbClient";
import bcrypt from "bcryptjs";

export async function onRequest(req) {
  try {
    // Parse request body safely
    const body = await req.json();

    const student_id = body.student_id ?? "";
    const password = body.password ?? "";
    const pin = body.pin ?? "";

    // Clean input
    const cleanStudentId = String(student_id).trim().toUpperCase();
    const cleanPassword = String(password).trim();
    const cleanPin = String(pin).trim();

    // Validate Student ID
    if (!cleanStudentId) {
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

    // Find student
    const { data: student, error: dbError } = await db
      .from("students")
      .select("*")
      .eq("student_id", cleanStudentId)
      .maybeSingle();

    if (dbError) {
      console.error("Database Error:", dbError);

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

    // ==========================
    // PASSWORD LOGIN
    // ==========================
    if (cleanPassword) {
      if (!student.password_hash) {
        return Response.json(
          {
            success: false,
            error: "Password has not been set."
          },
          {
            status: 400
          }
        );
      }

      const passwordMatched = await bcrypt.compare(
        cleanPassword,
        student.password_hash
      );

      if (!passwordMatched) {
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

    // ==========================
    // PIN LOGIN
    // ==========================
    else if (cleanPin) {
      if (
        student.pin === null ||
        student.pin === undefined ||
        student.pin === ""
      ) {
        return Response.json(
          {
            success: false,
            error: "PIN has not been set."
          },
          {
            status: 400
          }
        );
      }

      if (String(student.pin).trim() !== cleanPin) {
        return Response.json(
          {
            success: false,
            error: "Incorrect PIN code."
          },
          {
            status: 401
          }
        );
      }
    }

    // ==========================
    // NO AUTH METHOD PROVIDED
    // ==========================
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

    // ==========================
    // LOGIN SUCCESS
    // ==========================
    return Response.json(
      {
        success: true,
        user: {
          id: student.id,
          student_id: student.student_id,
          nickname: student.nickname ?? student.name,
          name: student.name,
          avatar: student.avatar ?? null,
          level: student.level ?? 1,
          profile_completed: Boolean(student.profile_completed)
        }
      },
      {
        status: 200
      }
    );

  } catch (err) {
    console.error("Authentication Error:", err);

    return Response.json(
      {
        success: false,
        error: "Internal server authentication error."
      },
      {
        status: 500
      }
    );
  }
}