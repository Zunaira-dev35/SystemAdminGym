<?php

if (!function_exists('apiSuccess')) {
    /**
     * Return a standardized success JSON response
     *
     * @param mixed $data
     * @param string $message
     * @param int $statusCode
     * @return \Illuminate\Http\JsonResponse
     */
    function apiSuccess($data = null, string $message = 'Success', int $statusCode = 200, $token = null , $tokenType = 'Bearer')
    {
        $response = [
            'status' => 'success',
            'message' => $message,
            'data'    => $data,
        ];

        if ($token) {
            $response['token'] = $token;
            $response['token_type'] = $tokenType;
        }
        return response()->json($response, $statusCode);
    }
}

if (!function_exists('apiError')) {
    /**
     * Return a standardized error JSON response
     *
     * @param string $message
     * @param int $statusCode
     * @param mixed $errors
     * @return \Illuminate\Http\JsonResponse
     */
    function apiError(string $message = 'Error', int $statusCode = 400, $errors = null)
    {
        return response()->json([
            'code' => $statusCode,
            'status' => 'error',
            'message' => $message,
            'errors' => $errors,
        ], $statusCode);
    }
}
