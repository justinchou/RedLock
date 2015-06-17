{
    "targets": [
        {
            "target_name": "sleep",
            "sources": [
                "src/sleep.cc"
            ],
            "include_dirs": [
                "<!(node -e \"require('nan')\")"
            ],
            "conditions": [
                [
                    "OS==\"linux\"",
                    {
                        "defines": [
                            "LINUX"
                        ],
                        'include_dirs': [
                            "/data/software/node-src/include/node/"
                        ]
                    }
                ],
                [
                    "OS==\"win\"",
                    {
                        "defines": [
                            "WIN32"
                        ]
                    }
                ]
            ]
        }
    ]
}
