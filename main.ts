import * as ts from "./TypeScript-fixInferUsage/built/local/typescript"
//import * as DefaultTs from "./TypeScript/built/local/typescript"


export function createProgramFromSource(sourceCode: string, fname: string = "dummy.ts"): [ts.Program, ts.TypeChecker, ts.SourceFile] {
    const options: ts.CompilerOptions = {
        module: ts.ModuleKind.AMD,
        target: ts.ScriptTarget.ES5
    }
    const host = ts.createCompilerHost(options)
    host.getSourceFile = (fileName: string) =>{
        return ts.createSourceFile(fileName, sourceCode, ts.ScriptTarget.ES5, undefined, ts.ScriptKind.TS)
    }
    const program = ts.createProgram([fname], options, host)
    const typeChecker = program.getTypeChecker()
    return [program, typeChecker, program.getSourceFile(fname)!]
}


export function inferAllFunctionParams(
    source: ts.SourceFile,
    program: ts.Program,
    typeChecker: ts.TypeChecker,
) {
    const acc: ts.codefix.ParameterInference[][] = []
    inferAllParamsWorker(source, source, program, typeChecker, acc)

    return acc
}


function someParamIsUndefined(functionDeclaration: ts.FunctionDeclaration, checker: ts.TypeChecker) {
    for (const param of functionDeclaration.parameters) {
        if (checker.getTypeAtLocation(param).flags & ts.TypeFlags.Any) {
            return true
        }
    }
    return false
} 

function inferAllParamsWorker(
    source: ts.SourceFile,
    node: ts.Node,
    program: ts.Program,
    typeChecker: ts.TypeChecker,
    acc: ts.codefix.ParameterInference[][],
) {
    switch (node.kind) {
        case ts.SyntaxKind.FunctionDeclaration:
            if (someParamIsUndefined(node as ts.FunctionDeclaration, typeChecker))
                acc.push(inferParameters(source, node as ts.FunctionDeclaration, program))
    }

    node.getChildren().forEach((child) => inferAllParamsWorker(source, child, program, typeChecker, acc))

}





export function print(node: ts.Node) {
    console.log(`kind: ${node.kind}: ${node.getText()}`)
    ts.forEachChild(node, print)
}








function inferParameters(source: ts.SourceFile, 
    functionDeclaration: ts.FunctionDeclaration,
    program: ts.Program,
): ts.codefix.ParameterInference[] 
{
    
    return ts.codefix.inferLeafFunction(functionDeclaration, source, program)

    //return DefaultTs.codefix.inferTypesForParameters(functionDeclaration as DefaultTs.FunctionDeclaration, source as DefaultTs.SourceFile, program as DefaultTs.Program) as ts.codefix.ParameterInference[] 
}



/*
const [typeChecker, source] = createProgramFromSource("function dummy(x: {x: number}) {x.x}")




//console.log(program.getSourceFile(name)?.text)


function lint(node: ts.Node) {
    console.log(`type: ${typeChecker.typeToString(typeChecker.getTypeAtLocation(node))}`)
    ts.forEachChild(node, lint)
}

lint(source)*/
