import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    // Get the request details from the client
    const { url, headers } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Make the request from the server
    const response = await fetch(url, {
      method: "GET",
      headers: headers || {},
      cache: "no-store",
    })

    // Get the response data
    const data = await response.text()

    // Return the response to the client
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      data,
    })
  } catch (error) {
    console.error("Proxy error:", error)
    return NextResponse.json(
      {
        success: false,
        status: 500,
        data: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}
