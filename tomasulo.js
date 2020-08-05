// guardara as configuracoes que serao passadas para o programa
// configuracoes possiveis: num de ciclos de determinado tipo de instrucao
// (ld || sd || multd || divd || addd || subd || add || daddui || beq || bnez) + cycles
let config = {
    "LDcycles": 0,
    "SDcycles": 0,
    "MULTDcycles": 0,
    "DIVDcycles": 0,
    "ADDDcycles": 0,
    "SUBDcycles": 0,
    "ADDcycles": 0,
    "DADDUIcycles": 0,
    "BEQcycles": 0,
    "BNEZcycles": 0,
    "exec": "fast" // fast or slow
};

class Instruction {
    constructor(inst) {
        // inst = OPCODE RESTO
        this.inst = inst;
        this.opcode = inst.split(" ")[0];
        this.resto = inst.split(" ").split(","); // guarda registradores e/ou label
        // usar o switch para definir exatamente o que terá em cada caso
        // ex: numa inst do tipo ADD, terá RD, RS e RT
        // numa inst do tipo BNEZ, terá RS e LABEL
        switch(this.opcode) {
            case "SD":
                this.type = "S";
                break;
            case "LD": 
                this.type = "L";
                break;
            case "MULTD":
            case "DIVD":
            case "ADDD":
            case "SUBD":
                this.type = "F";
                break;
            case "ADD":
            case "DADDUI":
                this.type = "R";
                this.rs = null;
                this.rt = null;
                this.rd = null;
                break;
            case "BEQ":
                this.rt = null;
                // caso seja do tipo B, verificar se é BEQ ou BNEZ
                // antes de presumir que tem RT, ou então poderá dar problema
                // pois em BNEZ, rt = undefined
            case "BNEZ":
                this.type = "B";
                this.rs = null;
                this.label = null;
                break;
        }
        this.cycles = config[this.opcode + "cycles"];
    }
}

class ReservationStation {
    constructor() {
        this.instruction = null;
        this.busy = false;
        this.opcode = null;
        this.vj = null;
        this.vk = null;
        this.qj = null;
        this.qk = null;
        this.time = null; // implementar o tempo do ciclo dentro das estações
        // this.locked = null; // indica se está travada ou nÃo, por conflito de reg. - talvez inútil
    }

    add_instruction(instruction, rstations) {
        this.instruction = instruction;
        this.busy = true;
        this.opcode = instruction.opcode;
        if (typeof rstations !== undefined) { // para obter overload no método
            // verifica se existem stations que estão usando os registradores da instrução
            // para colocar em vj e vk
        } 

        // qj e qk guardam registradores ?

        this.time = instruction.cycles;
    }
    clear() {
        this.instruction = null;
        this.busy = false;
        this.opcode = null;
        this.vj = null;
        this.vk = null;
        this.qj = null;
        this.qk = null;
        this.time = null;
    }

    busy() {
        return this.busy;
    }
    
    decrement_time() {
        // para simular passagem de tempo, quando chegar em 0 significa que terminou de executar
        this.time--;
    }
}

// Unidade de carregamento 
// talvez não seja necessária, podendo usar
// uma reservation station "modificada"
class LoadStoreUnit {
    constructor() {
        this.busy = false;
        this.address = null;
        //this.FunctUnit = null; estado atual dos registradores na unidade
    }

    busy() {
        return this.busy;
    }
}

// Qi - the reservation station whose result should be stored in this register (if blank or 0, no values are destined for this register)
class RegisterStatus {
    constructor() {
        this.registers = [];
        this.registers_fp = [];
        for (let i = 0; i < 8; i++) {
            this.registers.push(new Register("R" + i));
            this.registers_fp.push(new Register("F" + (i * 2)));
        }
    }

}

// classe para representar um registrador
// guarda um nome de registrador (Ri, i = [0 - 7]) e (F(i * 2), i = 0 - 7)
// e a station que está utilizando ele 
class Register {
    // talvez inutil, mas whatever
    constructor(name) {
        this.name = name;
        this.station = null;
    }
}

// TODO: não sei se seria melhor abordagem, nem se ExeUnit faz sentido neste caso
// mas seria a classe que segura todas as reservation stations
class ExeUnit {
    constructor() {
        this.integer_unit = []; // 3
        this.float_add_sub_unit = []; // 3
        this.float_mult_div_unit = []; // 2
        this.store_unit = []; // 3
        this.load_unit = []; // 6

        // inicializar unidades
        for (let i = 0; i < 3; i++) {
            // inicializando unidade de inteiro
            this.integer_unit.push(new ReservationStation()); 
            // inicializando unidade de ponto flutuante - addsub
            this.float_add_sub_unit.push(new ReservationStation());
            // inicializando unidade de store - talvez mudar
            this.store_unit.push(new ReservationStation());
            // inicializando unidade de load - talvez mudar
            this.load_unit.push(new ReservationStation());
            this.load_unit.push(new ReservationStation());
        }
        for (let i = 0; i < 2; i++) {
            // inicializando unidade de ponto flutuante - multdiv
            this.float_mult_div_unit.push(new ReservationStation()); 
        }
    }

    add_to_station(instruction) {
        // auxiliar de issue()
        if(instruction.type === "R") {
            for (let i = 0; i < this.integer_unit.length; i++) {
                if (!this.integer_unit[i].busy()) {
                    // tem station disponivel
                    // verificar se os registradores estão sendo utlizados por alguma station
                    // verificacao feita na variavel registers
                    return true; // true adicionou
                }
                return false; // false nao adicionou
            }
        }
        else if (instruction.type === "L") {}
        else if (instruction.type === "B") {}
        else if (instruction.type === "F") {
            if (instruction.opcode === "MULTD" || instruction.opcode === "DIVD") {
                // float_mult_div_unit
            }
            else {
                // float_add_sub_unit
            }
        }
        else {
            // S type
        }
    }
    // nome temporário, funcao que decrementa o tempo das instrucoes que estiverem numa reservation station
    // de forma a simular a execucao
    run_stations() {
        // auxiliar de execute()
        // percorre todas stations e verifica se pode decrementar
        // decrementar no caso: simular execucão, passagem de um ciclo
        // quando chegar a 0 na station, enviar a/as instrucao/os p/ que execute
        // escreva o ciclo que terminou 
        // quando chegar em 0, retornar quais instrucoes voltaram para que
        // a tabela seja atualizada
    }

    remove_from_station() {
        // aiuxiliar de write()
        // 
    }
}

// a classe que junta tudo
class Tomasulo {
    constructor() {
        this.execution_unit = new ExeUnit(); 
        this.instructions = new Queue();
        read_file(this.instructions);
        this.instructions_w = this.instructions.length(); // guarda numero de isntrucoes que nao foram esctiras
        this.table = new InstructionTable(); // guarda todas as instrucoes, tabela que exibe onde cada 
        // table = 2 arrays, um para inst e outro para status: [inst, (...)] e [["ciclo issue", "ciclo exe", "ciclo write"], (...)] 
        this.cycle = 1;
        this.finished = false;
    }
    issue(cycle) {
        var next_inst = this.instructions.peek();
        if (execution_unit.add_to_station(next_inst)) {
            this.table.add(next_inst, cycle);
            this.instructions.pop_front();
        }
        /*
        Retrieve the next instruction from the head of the instruction queue. If the instruction operands are currently in the registers, then
            If a matching functional unit is available, issue the instruction.
            Else, as there is no available functional unit, stall the instruction until a station or buffer is free.
        Otherwise, we can assume the operands are not in the registers, and so use virtual values. The functional unit must calculate the real value to keep track of the functional units that produce the operand.
        */

    };
    execute(cycle) {
        // verifica se eh possivel terminar de executar a instrucao
        // quando time = 0 na reserv station, significa que terminou de executar
        // dai limpar a station e adicionar o ciclo na tabela na instrucao

        /*
        If one or more of the operands is not yet available then: wait for operand to become available on the CDB.
        When all operands are available, then: if the instruction is a load or store
            Compute the effective address when the base register is available, and place it in the load/store buffer
                If the instruction is a load then: execute as soon as the memory unit is available
                Else, if the instruction is a store then: wait for the value to be stored before sending it to the memory unit
        Else, the instruction is an arithmetic logic unit (ALU) operation then: execute the instruction at the corresponding functional unit
        */
    };
    write(cycle) {
        // se conseguir escrever, decrementar 1 de instructions_w
        for (let i = 0; i < this.table.values; i++) {
            if (this.tables.status[i].length !== 2) {
                continue;
            }
            // se a execucao terminou no ciclo anterior, significa que devo escrever neste atual
            if (this.table.status[i][1] === cycle - 1 && this.table.status[i][2] === undefined) {
                this.table.status[i].push(cycle);
                /*
                If the instruction was an ALU operation
                    If the result is available, then: write it on the CDB and from there into the registers and any reservation stations waiting for this result
                Else, if the instruction was a store then: write the data to memory during this step
                */
                // this.table.instructions[i] -> a instrucao que foi escrita
                // acessa exe_unit e "limpa" tudo que era dependente da instrucao
                this.instructions_w--;
            }
        }
    };
    run() {
        // cada vez que aperta um botao ele chama run
        // se ainda houver instruções na fila
        // e ainda houver isntruções que não foram escritas (instructions_w > 0)
        if (!this.finished) {
            // verifica tipo da instrucao
            // 
            if (!this.instructions.empty()) {
                // se fila de isntrucoes não estiver vazia, precisa tentar dar issue 
                this.issue(cycle);
            }
            this.execute(cycle);
            this.write(cycle);

            // antes de incrementar ciclo, atualizar diagramas das reservation stations e register status
            // TODO: funcao para atualizar diagramas
            
            if (!this.instructions.empty() && this.instructions_w > 0) {
                cycle++;
            } else {
                this.finished = true;
            }
        }
    }
}

class Queue {
    constructor(inst) {
        this.q = [];
    }

    peek() {
        return this.q[0];
    }

    push_back(obj) {
        this.q.push(obj);
    }

    pop_front() {
        return this.q.shift();
    }

    empty() {
        return Array.isArray(this.q) && this.q.length() === 0;
    }
}

class InstructionTable {
    constructor() {
        this.instructions = [];
        this.status = [];
    }

    add(instruction, cycle) {
        this.instructions.push(instruction);
        this.status.push([cycle]);
    }
}

function read_file(instructions) {
    $.get( "./exemplos/1.txt", function() {
        alert("lido");
    }).fail(function() {
        alert("não lido")
    }).done(function(data) {
        data = data.split("\n");
        for (let i = 0; i < data.length; i++) {
            instructions.push_back(new Instruction(data[i]));
        }
    });
}

function help() {
    a = "Dicas de uso: \nPara inserir uma intrução na unidade escolha as instruções a serem utilizadas e seus respectivos registradores, então clique em 'CONFIRMAR' para executar os dados ou 'RESET' para limpar os campos\n\nO botão 'Próximo' avançará para o proximo ciclo e o botão 'Resultado' apresenta o resultado final da execução do algoritmo";
    alert(a);
}

// modo lento
// on button click: t.run()

// modo rapido
// while (!t.over): t.run()

// pega instruction da entrada, joga para a reservation station e executa